"""FastAPI routes for recurring invoice management."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.modules.auth.deps import get_current_user, get_db
from app.modules.auth.models import User

from .models import RecurringInvoice, RecurringInvoiceLog, RecurringInvoiceStatus
from .schemas import (
    RecurringInvoiceCreate,
    RecurringInvoiceLogResponse,
    RecurringInvoiceResponse,
    RecurringInvoiceUpdate,
)
from .utils import CronExpressionError, next_run_from_cron

router = APIRouter(prefix="/recurring-invoices", tags=["Recurring Invoices"])


def _validate_schedule(expression: str, reference: datetime) -> datetime:
    try:
        return next_run_from_cron(expression, reference)
    except CronExpressionError as exc:  # pragma: no cover - validation guard
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, f"Invalid cron expression: {exc}"
        ) from exc


@router.post("/", response_model=RecurringInvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_recurring_invoice(
    payload: RecurringInvoiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecurringInvoiceResponse:
    next_run = _validate_schedule(payload.schedule, datetime.utcnow())
    invoice = RecurringInvoice(
        user_id=current_user.id,
        schedule=payload.schedule,
        next_run=next_run,
        template=payload.template,
        status=payload.status,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return RecurringInvoiceResponse.model_validate(invoice)


@router.get("/", response_model=list[RecurringInvoiceResponse])
def get_recurring_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[RecurringInvoiceResponse]:
    invoices = (
        db.query(RecurringInvoice)
        .filter(RecurringInvoice.user_id == current_user.id)
        .order_by(RecurringInvoice.created_at.desc())
        .all()
    )
    return [RecurringInvoiceResponse.model_validate(row) for row in invoices]


@router.put("/{invoice_id}", response_model=RecurringInvoiceResponse)
def update_recurring_invoice(
    invoice_id: int,
    payload: RecurringInvoiceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecurringInvoiceResponse:
    invoice: RecurringInvoice | None = (
        db.query(RecurringInvoice)
        .filter(
            RecurringInvoice.id == invoice_id,
            RecurringInvoice.user_id == current_user.id,
        )
        .first()
    )
    if invoice is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recurring invoice not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "schedule" in update_data:
        invoice.next_run = _validate_schedule(update_data["schedule"], datetime.utcnow())

    for field, value in update_data.items():
        setattr(invoice, field, value)

    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return RecurringInvoiceResponse.model_validate(invoice)


@router.delete(
    "/{invoice_id}",
    status_code=status.HTTP_200_OK,
    response_class=Response,
)
def delete_recurring_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    deleted = (
        db.query(RecurringInvoice)
        .filter(
            RecurringInvoice.id == invoice_id,
            RecurringInvoice.user_id == current_user.id,
        )
        .delete()
    )
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recurring invoice not found")
    db.commit()
    return Response(status_code=status.HTTP_200_OK)


@router.post("/{invoice_id}/trigger", response_model=RecurringInvoiceLogResponse)
def trigger_invoice_generation(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecurringInvoiceLogResponse:
    invoice: RecurringInvoice | None = (
        db.query(RecurringInvoice)
        .filter(
            RecurringInvoice.id == invoice_id,
            RecurringInvoice.user_id == current_user.id,
        )
        .first()
    )
    if invoice is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recurring invoice not found")

    log_entry = RecurringInvoiceLog(
        recurring_invoice_id=invoice.id,
        status="success",
        details="Invoice generated manually",
    )
    db.add(log_entry)

    invoice.next_run = _validate_schedule(invoice.schedule, datetime.utcnow())
    db.add(invoice)

    db.commit()
    db.refresh(log_entry)
    return RecurringInvoiceLogResponse.model_validate(log_entry)


@router.get("/{invoice_id}/logs", response_model=list[RecurringInvoiceLogResponse])
def get_invoice_logs(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[RecurringInvoiceLogResponse]:
    invoice: RecurringInvoice | None = (
        db.query(RecurringInvoice)
        .filter(
            RecurringInvoice.id == invoice_id,
            RecurringInvoice.user_id == current_user.id,
        )
        .first()
    )
    if invoice is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recurring invoice not found")

    return [RecurringInvoiceLogResponse.model_validate(log) for log in invoice.logs]


__all__ = ["router"]
