from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class MarginRow(BaseModel):
    project_id: int
    project_name: str
    client_name: str
    revenue: float
    cost: float
    margin: float
    margin_percentage: float


class AlertOut(BaseModel):
    type: Literal["maintenance", "double_booking", "low_stock"]
    severity: Literal["info", "warning", "critical"] = "warning"
    message: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class AlertSummary(BaseModel):
    alerts: list[AlertOut]
