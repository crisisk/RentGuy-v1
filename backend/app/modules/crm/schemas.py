"""Pydantic schemas for CRM endpoints."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field


class LeadBase(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    source: str | None = None
    status: str = Field(default="new", max_length=50)


class LeadCreate(LeadBase):
    external_id: str | None = Field(default=None, max_length=120)


class LeadOut(LeadBase):
    id: int
    external_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class PipelineStage(BaseModel):
    id: int
    name: str
    order: int
    automation_flow: str | None = None

    model_config = {"from_attributes": True}


class DealBase(BaseModel):
    title: str
    lead_id: int | None = None
    pipeline_id: int
    stage_id: int
    value: float = 0.0
    currency: str = "EUR"
    expected_close: date | None = None
    probability: int = 0


class DealCreate(DealBase):
    pass


class DealUpdateStage(BaseModel):
    stage_id: int


class DealOut(DealBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime
    stage: PipelineStage

    model_config = {"from_attributes": True}


class ActivityCreate(BaseModel):
    deal_id: int
    activity_type: str
    summary: str
    payload: str | None = None
    occurred_at: datetime | None = None


class ActivityOut(BaseModel):
    id: int
    activity_type: str
    summary: str
    payload: str | None = None
    occurred_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class AutomationRunOut(BaseModel):
    id: int
    trigger: str
    workflow_id: str
    status: str
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}
