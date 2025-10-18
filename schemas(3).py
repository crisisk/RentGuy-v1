from pydantic import BaseModel
from typing import List
from datetime import date, datetime

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
    class Config: from_attributes = True
