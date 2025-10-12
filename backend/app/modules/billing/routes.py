from __future__ import annotations

import csv
import io
from urllib.parse import parse_qs

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.auth.deps import get_db, require_role
from .adapters.mollie_adapter import mollie_adapter_from_settings
from .adapters.stripe_adapter import stripe_adapter_from_settings, StripeAdapterError
from .repo import BillingRepo
from .schemas import CheckoutRequest, CheckoutSessionOut, InvoiceIn, InvoiceOut, PaymentOut
from .usecases import BillingService


router = APIRouter()


def _service(db: Session) -> BillingService:
    return BillingService(BillingRepo(db))


@router.get("/billing/invoices", response_model=list[InvoiceOut])
def list_invoices(db: Session = Depends(get_db), user=Depends(require_role("admin", "planner", "finance", "viewer"))):
    return BillingRepo(db).list_invoices()


@router.post("/billing/invoices", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def create_invoice(payload: InvoiceIn, db: Session = Depends(get_db), user=Depends(require_role("admin", "planner", "finance"))):
    service = _service(db)
    invoice = service.create_invoice(
        project_id=payload.project_id,
        client_name=payload.client_name,
        currency=payload.currency,
        issued_at=payload.issued_at,
        due_at=payload.due_at,
        reference=payload.reference,
        vat_rate=payload.vat_rate,
        line_items=payload.line_items,
        total_net_override=payload.total_net_override,
        total_vat_override=payload.total_vat_override,
        sync_with_invoice_ninja=payload.sync_with_invoice_ninja,
    )
    db.commit()
    return invoice


@router.get("/billing/invoices/{invoice_id}/payments", response_model=list[PaymentOut])
def list_payments(invoice_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin", "finance"))):
    repo = BillingRepo(db)
    invoice = repo.get_invoice(invoice_id)
    if not invoice:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")
    return repo.list_payments_for_invoice(invoice_id)


@router.get("/billing/export.csv")
def export_csv(from_date: str, to_date: str, db: Session = Depends(get_db), user=Depends(require_role("admin", "finance"))):
    repo = BillingRepo(db)
    invoices = repo.list_invoices()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["invoice_id", "date", "client", "currency", "total_net", "total_vat", "total_gross", "vat_rate", "status", "reference"])
    for invoice in invoices:
        issued = str(invoice.issued_at)
        if from_date <= issued <= to_date:
            writer.writerow([
                invoice.id,
                issued,
                invoice.client_name,
                invoice.currency,
                float(invoice.total_net or 0),
                float(invoice.total_vat or 0),
                float(invoice.total_gross or 0),
                float(invoice.vat_rate or 0),
                invoice.status,
                invoice.reference or "",
            ])
    return Response(content=buf.getvalue(), media_type="text/csv")


@router.post("/billing/payments/stripe/checkout", response_model=CheckoutSessionOut)
def start_stripe_checkout(payload: CheckoutRequest, db: Session = Depends(get_db), user=Depends(require_role("admin", "finance"))):
    repo = BillingRepo(db)
    invoice = repo.get_invoice(payload.invoice_id)
    if not invoice:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")
    service = _service(db)
    result = service.start_stripe_checkout(invoice, success_url=payload.success_url, cancel_url=payload.cancel_url, customer_email=payload.customer_email)
    db.commit()
    return CheckoutSessionOut(provider=result.provider, external_id=result.external_id, checkout_url=result.checkout_url)


@router.post("/billing/payments/mollie/session", response_model=CheckoutSessionOut)
def start_mollie_payment(payload: CheckoutRequest, db: Session = Depends(get_db), user=Depends(require_role("admin", "finance"))):
    repo = BillingRepo(db)
    invoice = repo.get_invoice(payload.invoice_id)
    if not invoice:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")
    service = _service(db)
    webhook_base = settings.PAYMENT_WEBHOOK_BASE_URL or ""
    webhook_url = f"{webhook_base.rstrip('/')}/api/v1/billing/payments/mollie/webhook"
    result = service.start_mollie_payment(invoice, redirect_url=payload.success_url, webhook_url=webhook_url)
    db.commit()
    return CheckoutSessionOut(provider=result.provider, external_id=result.external_id, checkout_url=result.checkout_url)


@router.post("/billing/payments/stripe/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(..., alias="Stripe-Signature"), db: Session = Depends(get_db)):
    adapter = stripe_adapter_from_settings()
    if not adapter:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Stripe adapter niet geconfigureerd")
    payload = await request.body()
    try:
        event = adapter.verify_webhook(payload, stripe_signature)
    except StripeAdapterError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    service = _service(db)
    status_label = service.handle_stripe_event(event)
    db.commit()
    return {"status": status_label}


@router.post("/billing/payments/mollie/webhook")
async def mollie_webhook(request: Request, mollie_signature: str | None = Header(None, alias="X-Mollie-Signature"), db: Session = Depends(get_db)):
    raw_body = await request.body()
    adapter = mollie_adapter_from_settings()
    if adapter and not adapter.verify_webhook(raw_body, mollie_signature or ""):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ongeldige Mollie-handtekening")
    params = parse_qs(raw_body.decode())
    payment_id = params.get("id", [None])[0]
    if not payment_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "payment id ontbreekt")
    service = _service(db)
    payload = service.handle_mollie_notification(payment_id)
    db.commit()
    return {"status": payload.get("status", "unknown")}
