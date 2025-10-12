from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

class CategoryIn(BaseModel):
    name: str

class CategoryOut(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

class ItemIn(BaseModel):
    name: str
    category_id: int
    quantity_total: int = 0
    min_stock: int = 0
    active: bool = True
    price_per_day: float = 0
    cost_per_day: float = 0

class ItemOut(BaseModel):
    id: int
    name: str
    category_id: int
    quantity_total: int
    min_stock: int
    active: bool
    price_per_day: float
    cost_per_day: float

    model_config = ConfigDict(from_attributes=True)

class BundleIn(BaseModel):
    name: str
    active: bool = True

class BundleItemIn(BaseModel):
    item_id: int
    quantity: int = 1

class BundleOut(BaseModel):
    id: int
    name: str
    active: bool
    items: list[BundleItemIn] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class MaintenanceLogIn(BaseModel):
    item_id: int
    due_date: Optional[date] = None
    note: Optional[str] = None

class MaintenanceLogOut(BaseModel):
    id: int
    item_id: int
    due_date: Optional[date] = None
    done: bool
    note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Availability
class AvailabilityRequest(BaseModel):
    item_id: int
    quantity: int
    start: date
    end: date

class AvailabilityResponse(BaseModel):
    item_id: int
    requested: int
    available: int
    ok: bool
