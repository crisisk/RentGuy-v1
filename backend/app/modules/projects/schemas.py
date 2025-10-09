from __future__ import annotations

from datetime import date
from typing import List, Literal

from pydantic import BaseModel


class InventoryAlert(BaseModel):
    item_id: int
    label: str
    severity: Literal["warning", "critical"]
    message: str
    suggested_action: str | None = None


class ProjectIn(BaseModel):
    name: str
    client_name: str
    start_date: date
    end_date: date
    notes: str = ""

class ProjectOut(BaseModel):
    id: int
    name: str
    client_name: str
    start_date: date
    end_date: date
    notes: str = ""
    status: Literal["upcoming", "active", "completed", "at_risk"] | None = None
    days_until_start: int | None = None
    duration_days: int | None = None
    inventory_risk: Literal["ok", "warning", "critical"] | None = None
    inventory_alerts: List[str] | None = None
    inventory_alerts_detailed: List[InventoryAlert] | None = None
    class Config:
        from_attributes = True

class ReserveItemIn(BaseModel):
    item_id: int
    qty: int

class ReserveRequest(BaseModel):
    items: List[ReserveItemIn]

class ProjectItemOut(BaseModel):
    id: int
    project_id: int
    item_id: int
    qty_reserved: int
    class Config:
        from_attributes = True

class ProjectDetail(BaseModel):
    project: ProjectOut
    items: List[ProjectItemOut]
