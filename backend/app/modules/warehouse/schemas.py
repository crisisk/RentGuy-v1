from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict

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

    model_config = ConfigDict(from_attributes=True)
