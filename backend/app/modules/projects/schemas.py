from __future__ import annotations

from datetime import date
from typing import Dict, List, Literal

from pydantic import BaseModel

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
    timeline_label: str | None = None
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


class ProjectSummary(BaseModel):
    total_projects: int
    status_breakdown: Dict[str, int]
    risk_breakdown: Dict[str, int]
    upcoming_within_7_days: int
    completed_last_30_days: int
    critical_alerts: int
