from __future__ import annotations

from typing import Iterable, Optional

from .adapters.rentguy_finance import RentGuyFinanceClient, rentguy_finance_from_settings
from .adapters.mollie_adapter import MollieAdapter, mollie_adapter_from_settings, MollieAdapterError
from .adapters.stripe_adapter import StripeAdapter, stripe_adapter_from_settings, StripeAdapterError
from .models import Invoice, Payment
from .ports import BillingPort, CheckoutResult
from .repo import BillingRepo
from .schemas import InvoiceLineIn


class BillingService(BillingPort):
    def __init__(self, repo: BillingRepo) -> None:
        self.repo = repo
        self._stripe: StripeAdapter | None = None
        self._mollie: MollieAdapter | None = None
        self._finance_bridge: RentGuyFinanceClient | None = None

    def create_invoice(
        self,
        *,
        project_id: int,
        client_name: str,
        currency: str,
        issued_at,
        due_at,
        reference: Optional[str],
        vat_rate: Optional[float],
        line_items: Iterable[InvoiceLineIn],
        total_net_override: Optional[float],
        total_vat_override: Optional[float],
        sync_with_finance_bridge: bool,
    ) -> Invoice:
        lines = list(line_items)
        resolved_vat = vat_rate
        if resolved_vat is None:
            resolved_vat = lines[0].vat_rate if lines and lines[0].vat_rate is not None else 21.0
        totals = self._calculate_totals(lines, resolved_vat, total_net_override, total_vat_override)

        invoice = Invoice(
            project_id=project_id,
            client_name=client_name,
            currency=currency,
            total_net=totals[0],
            total_vat=totals[1],
            total_gross=totals[2],
            vat_rate=resolved_vat,
            status="draft",
            issued_at=issued_at,
            due_at=due_at,
            reference=reference,
        )
        invoice = self.repo.add_invoice(invoice)

        if sync_with_finance_bridge:
            client = self._finance_bridge_client()
            if client:
                bridge_payload = self._build_finance_bridge_payload(invoice, lines, resolved_vat)
                client.create_invoice(bridge_payload)

        return invoice

    def start_stripe_checkout(self, invoice: Invoice, *, success_url: str, cancel_url: str, customer_email: Optional[str]) -> CheckoutResult:
        adapter = self._stripe_adapter()
        if not adapter:
            raise StripeAdapterError("Stripe adapter is not configured")
        session = adapter.create_checkout_session(
            amount=float(invoice.total_gross or 0),
            currency=invoice.currency,
            invoice_id=invoice.id,
            customer_email=customer_email,
            success_url=success_url,
            cancel_url=cancel_url,
        )
        payment = Payment(
            invoice_id=invoice.id,
            provider="stripe",
            external_id=session.get("id", ""),
            amount=float(invoice.total_gross or 0),
            status="pending",
        )
        self.repo.add_payment(payment)
        return CheckoutResult(provider="stripe", external_id=session.get("id", ""), checkout_url=session.get("url", ""))

    def start_mollie_payment(self, invoice: Invoice, *, redirect_url: str, webhook_url: str) -> CheckoutResult:
        adapter = self._mollie_adapter()
        if not adapter:
            raise MollieAdapterError("Mollie adapter is not configured")
        payment = adapter.create_payment(
            amount=float(invoice.total_gross or 0),
            currency=invoice.currency,
            description=f"Invoice #{invoice.id}",
            redirect_url=redirect_url,
            webhook_url=webhook_url,
        )
        payment_obj = Payment(
            invoice_id=invoice.id,
            provider="mollie",
            external_id=payment.get("id", ""),
            amount=float(invoice.total_gross or 0),
            status=payment.get("status", "open"),
        )
        self.repo.add_payment(payment_obj)
        return CheckoutResult(provider="mollie", external_id=payment.get("id", ""), checkout_url=payment.get("_links", {}).get("checkout", {}).get("href", ""))

    def handle_stripe_event(self, event: dict) -> str:
        event_type = event.get("type")
        data = event.get("data", {}).get("object", {})
        if event_type == "checkout.session.completed":
            external_id = data.get("id")
            payment = self.repo.get_payment_by_external("stripe", external_id)
            if payment:
                payment.status = "succeeded"
                amount_total = data.get("amount_total")
                if amount_total is not None:
                    payment.amount = float(amount_total) / 100.0
                self.repo.touch_payment(payment)
                invoice = self.repo.get_invoice(payment.invoice_id)
                if invoice:
                    invoice.status = "paid"
                    self.repo.touch_invoice(invoice)
            return "checkout.session.completed"
        return event_type or "ignored"

    def handle_mollie_notification(self, payment_id: str) -> dict:
        adapter = self._mollie_adapter()
        if not adapter:
            raise MollieAdapterError("Mollie adapter is not configured")
        payment_data = adapter.get_payment(payment_id)
        payment = self.repo.get_payment_by_external("mollie", payment_id)
        if payment:
            payment.status = payment_data.get("status", payment.status)
            amount_value = payment_data.get("amount", {}).get("value")
            if amount_value:
                payment.amount = float(amount_value)
            self.repo.touch_payment(payment)
            if payment.status in {"paid", "authorized"}:
                invoice = self.repo.get_invoice(payment.invoice_id)
                if invoice:
                    invoice.status = "paid"
                    self.repo.touch_invoice(invoice)
        return payment_data

    def _calculate_totals(self, line_items: Iterable[InvoiceLineIn], vat_rate: float, net_override: Optional[float], vat_override: Optional[float]) -> tuple[float, float, float]:
        items = list(line_items)
        if items:
            net = 0.0
            vat = 0.0
            for line in items:
                line_net = float(line.quantity) * float(line.unit_price)
                rate = vat_rate if line.vat_rate is None else float(line.vat_rate)
                line_vat = line_net * (rate / 100.0)
                net += line_net
                vat += line_vat
            gross = net + vat
        else:
            net = float(net_override or 0.0)
            vat = float(vat_override or 0.0)
            gross = net + vat
        return round(net, 2), round(vat, 2), round(gross, 2)

    def _build_finance_bridge_payload(self, invoice: Invoice, line_items: Iterable[InvoiceLineIn], vat_rate: float) -> dict:
        items = list(line_items)
        if not items:
            items = [
                InvoiceLineIn(description=invoice.reference or f"Invoice {invoice.id}", quantity=1, unit_price=float(invoice.total_net), vat_rate=vat_rate)
            ]
        payload_items = [
            {
                "product_key": item.description,
                "notes": item.description,
                "quantity": item.quantity,
                "cost": round(float(item.unit_price), 2),
                "tax_rate1": float(item.vat_rate if item.vat_rate is not None else vat_rate),
            }
            for item in items
        ]
        return {
            "number": invoice.reference or f"INV-{invoice.id}",
            "client_id": str(invoice.project_id),
            "amount": float(invoice.total_gross),
            "line_items": payload_items,
        }

    def _stripe_adapter(self) -> StripeAdapter | None:
        if self._stripe is None:
            self._stripe = stripe_adapter_from_settings()
        return self._stripe

    def _mollie_adapter(self) -> MollieAdapter | None:
        if self._mollie is None:
            self._mollie = mollie_adapter_from_settings()
        return self._mollie

    def _finance_bridge_client(self) -> RentGuyFinanceClient | None:
        if self._finance_bridge is None:
            self._finance_bridge = rentguy_finance_from_settings()
        return self._finance_bridge
