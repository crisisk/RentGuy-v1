from pydantic import BaseModel
from typing import Literal

class ScanIn(BaseModel):
    tag_value: str
    direction: Literal["out","in"]
    project_id: int
    qty: int = 1

class MovementOut(BaseModel):
    id: int
    item_id: int
    project_id: int
    quantity: int
    direction: str
    method: str
    class Config: from_attributes = True
