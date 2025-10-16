"""Pydantic schemas for CRM endpoints."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator


class LeadBase(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    source: str | None = None
    status: str = Field(default="new", max_length=50)


class LeadCreate(LeadBase):
    external_id: str | None = Field(default=None, max_length=120)


class LeadCaptureSubmission(BaseModel):
    tenant: str
    first_name: str
    last_name: str
    email: str
    phone: str | None = None
    source: str | None = None
    marketing_opt_in: bool = False
    message: str | None = None
    captcha_token: str
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, value: str) -> str:
        lowered = value.strip().lower()
        if "@" not in lowered:
            raise ValueError("Invalid email address")
        return lowered

    @field_validator("tenant")
    @classmethod
    def _tenant_lower(cls, value: str) -> str:
        return value.strip().lower()


class LeadCaptureResponse(BaseModel):
    lead_id: int
    status: str
    automation_triggered: bool = False


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



class HeadlineKPIs(BaseModel):
    total_pipeline_value: float
    weighted_pipeline_value: float
    won_value_last_30_days: float
    avg_deal_cycle_days: float | None = None
    automation_failure_rate: float
    active_workflows: int


class LeadFunnelKPIs(BaseModel):
    total_leads: int
    leads_last_30_days: int
    leads_with_deals: int
    conversion_rate: float


class PipelineStageKPI(BaseModel):
    stage_id: int
    stage_name: str
    deal_count: int
    total_value: float
    weighted_value: float
    avg_age_days: float | None = None


class AutomationWorkflowKPI(BaseModel):
    workflow_id: str
    run_count: int
    failed_runs: int
    avg_completion_minutes: float | None = None
    sla_breaches: int
    failure_rate: float


class DashboardSummary(BaseModel):
    generated_at: datetime
    headline: HeadlineKPIs
    lead_funnel: LeadFunnelKPIs
    pipeline: list[PipelineStageKPI]
    automation: list[AutomationWorkflowKPI]
