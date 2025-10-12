from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class InvoiceLineIn(BaseModel):
    description: str
    quantity: int = 1
    unit_price: float
    vat_rate: float | None = None

class InvoiceIn(BaseModel):
    project_id: int
    client_name: str
    currency: str = "EUR"
    issued_at: date
    due_at: date
    reference: str | None = None
    vat_rate: float | None = None
    line_items: list[InvoiceLineIn] = Field(default_factory=list)
    total_net_override: float | None = None
    total_vat_override: float | None = None
    sync_with_invoice_ninja: bool = False

class InvoiceOut(BaseModel):
    id: int
    project_id: int
    client_name: str
    currency: str
    total_net: float
    total_vat: float
    total_gross: float
    vat_rate: float
    status: str
    issued_at: date
    due_at: date
    reference: str | None = None

    model_config = ConfigDict(from_attributes=True)


class CheckoutRequest(BaseModel):
    invoice_id: int
    success_url: str
    cancel_url: str
    customer_email: str | None = None


class CheckoutSessionOut(BaseModel):
    provider: Literal["stripe", "mollie"]
    external_id: str
    checkout_url: str


class PaymentOut(BaseModel):
    id: int
    provider: str
    external_id: str
    amount: float
    status: str

    model_config = ConfigDict(from_attributes=True)
