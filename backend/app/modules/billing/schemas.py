from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

class InvoiceIn(BaseModel):
    project_id: int
    client_name: str
    currency: str = "EUR"
    issued_at: date
    due_at: date

class InvoiceOut(BaseModel):
    id: int
    project_id: int
    client_name: str
    currency: str
    total_gross: float
    status: str
    issued_at: date
    due_at: date

    model_config = ConfigDict(from_attributes=True)
