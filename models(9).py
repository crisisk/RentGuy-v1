from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime

class InventoryReserved(BaseModel):
    event_type: Literal["InventoryReserved"] = "InventoryReserved"
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    project_id: int
    item_id: int
    qty: int
