"""
Pydantic schemas for recurring invoices module
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, validator
import croniter

class Frequency(str, Enum):
    DAILY = "0 0 * * *"
    WEEKLY = "0 0 * * 0"
    MONTHLY = "0 0 1 * *"
    YEARLY = "0 0 1 1 *"

class RecurringInvoiceCreate(BaseModel):
    schedule: str = Field(..., example="0 0 * * *", description="Cron schedule expression")
    template: dict = Field(..., example={"amount": 100, "client_id": 1})
    status: Optional[str] = Field("active", example="active")

    @validator("schedule")
    def validate_cron(cls, v):
        if not croniter.croniter.is_valid(v):
            raise ValueError("Invalid cron expression")
        return v

    @validator("template")
    def validate_template(cls, v):
        if not isinstance(v, dict):
            raise ValueError("Template must be a JSON object")
        if "amount" not in v or "client_id" not in v:
            raise ValueError("Template must contain 'amount' and 'client_id'")
        return v

class RecurringInvoiceUpdate(BaseModel):
    schedule: Optional[str] = Field(None, example="0 0 * * 1")
    template: Optional[dict] = Field(None)
    status: Optional[str] = Field(None)

    @validator("schedule")
    def validate_cron(cls, v):
        if v and not croniter.croniter.is_valid(v):
            raise ValueError("Invalid cron expression")
        return v

class RecurringInvoiceResponse(BaseModel):
    id: int
    user_id: int
    schedule: str
    next_run: datetime
    template: dict
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class RecurringInvoiceLogResponse(BaseModel):
    id: int
    recurring_invoice_id: int
    generated_at: datetime
    status: str
    details: Optional[str]
    invoice_id: Optional[int]

    class Config:
        orm_mode = True