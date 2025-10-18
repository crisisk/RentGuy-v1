"""Pydantic schemas for recurring invoice APIs."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .models import RecurringInvoiceStatus
from .utils import is_valid_cron


class RecurringInvoiceCreate(BaseModel):
    schedule: str = Field(..., description="Cron schedule expression")
    template: dict = Field(..., description="Invoice template payload")
    status: RecurringInvoiceStatus = Field(default=RecurringInvoiceStatus.ACTIVE)

    @field_validator("schedule")
    @classmethod
    def _validate_cron(cls, value: str) -> str:
        if not is_valid_cron(value):
            raise ValueError("Invalid cron expression")
        return value


class RecurringInvoiceUpdate(BaseModel):
    schedule: Optional[str] = Field(default=None)
    template: Optional[dict] = Field(default=None)
    status: Optional[RecurringInvoiceStatus] = Field(default=None)

    @field_validator("schedule")
    @classmethod
    def _validate_cron(cls, value: Optional[str]) -> Optional[str]:
        if value and not is_valid_cron(value):
            raise ValueError("Invalid cron expression")
        return value


class RecurringInvoiceResponse(BaseModel):
    id: int
    user_id: int
    schedule: str
    next_run: datetime
    template: dict
    status: RecurringInvoiceStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecurringInvoiceLogResponse(BaseModel):
    id: int
    recurring_invoice_id: int
    generated_at: datetime
    status: str
    details: Optional[str]
    invoice_id: Optional[int]

    model_config = ConfigDict(from_attributes=True)


__all__ = [
    "RecurringInvoiceCreate",
    "RecurringInvoiceUpdate",
    "RecurringInvoiceResponse",
    "RecurringInvoiceLogResponse",
]
