"""FastAPI router exposing CRM endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.modules.auth.deps import get_db, require_role
from .schemas import (
    ActivityCreate,
    ActivityOut,
    AutomationRunOut,
    DealCreate,
    DealOut,
    DealUpdateStage,
    LeadCreate,
    LeadOut,
)
from .service import CRMService, serialize_deal, serialize_lead

router = APIRouter()


def get_tenant_id(x_tenant_id: str = Header(..., alias="X-Tenant-ID")) -> str:
    return x_tenant_id


def service(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    return CRMService(db, tenant_id)


@router.get("/crm/leads", response_model=list[LeadOut])
def list_leads(
    svc: CRMService = Depends(service),
    user=Depends(require_role("admin", "planner", "sales", "viewer")),
):
    return [serialize_lead(lead) for lead in svc.list_leads()]


@router.post("/crm/leads", response_model=LeadOut, status_code=201)
def create_lead(
    payload: LeadCreate,
    svc: CRMService = Depends(service),
    user=Depends(require_role("admin", "planner", "sales")),
):
    lead = svc.create_lead(payload)
    return serialize_lead(lead)


@router.get("/crm/deals", response_model=list[DealOut])
def list_deals(
    svc: CRMService = Depends(service),
    user=Depends(require_role("admin", "planner", "sales", "viewer")),
):
    return [serialize_deal(deal) for deal in svc.list_deals()]


@router.post("/crm/deals", response_model=DealOut, status_code=201)
def create_deal(
    payload: DealCreate,
    svc: CRMService = Depends(service),
    user=Depends(require_role("admin", "planner", "sales")),
):
    deal = svc.create_deal(payload)
    return serialize_deal(deal)


@router.post("/crm/deals/{deal_id}/advance", response_model=DealOut)
def advance_deal(
    deal_id: int,
    payload: DealUpdateStage,
    svc: CRMService = Depends(service),
    user=Depends(require_role("admin", "planner", "sales")),
):
    deal, _automation = svc.advance_stage(deal_id, payload.stage_id)
    return serialize_deal(deal)


@router.post("/crm/activities", response_model=ActivityOut, status_code=201)
def log_activity(
    payload: ActivityCreate,
    svc: CRMService = Depends(service),
    user=Depends(require_role("admin", "planner", "sales", "viewer")),
):
    activity = svc.log_activity(payload)
    return ActivityOut.model_validate(activity)


@router.get("/crm/deals/{deal_id}/activities", response_model=list[ActivityOut])
def list_activities(
    deal_id: int,
    svc: CRMService = Depends(service),
    user=Depends(require_role("admin", "planner", "sales", "viewer")),
):
    activities = svc.list_activities(deal_id)
    return [ActivityOut.model_validate(act) for act in activities]


@router.get("/crm/deals/{deal_id}/automation", response_model=list[AutomationRunOut])
def list_automation_runs(
    deal_id: int,
    svc: CRMService = Depends(service),
    user=Depends(require_role("admin", "planner", "sales", "viewer")),
):
    runs = svc.list_automation_runs(deal_id)
    return [AutomationRunOut.model_validate(run) for run in runs]
