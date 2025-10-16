"""Domain service layer for CRM operations."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable

from sqlalchemy.orm import Session

from app.core.errors import AppError

from . import models
from .schemas import ActivityCreate, DealCreate, DealOut, LeadCreate, LeadOut

try:  # Optional dependency - used to emit automation events
    from apps.automation.engine import default_engine
except ModuleNotFoundError:  # pragma: no cover - defensive fallback
    default_engine = None  # type: ignore


@dataclass
class AutomationResult:
    workflow_id: str
    trigger: str
    status: str
    run_id: str
    completed_at: datetime | None


class CRMService:
    """Encapsulates write operations and automation triggers."""

    def __init__(self, db: Session, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    # Lead operations -----------------------------------------------------
    def list_leads(self) -> list[models.CRMLead]:
        return (
            self.db.query(models.CRMLead)
            .filter(models.CRMLead.tenant_id == self.tenant_id)
            .order_by(models.CRMLead.created_at.desc())
            .all()
        )

    def create_lead(self, payload: LeadCreate) -> models.CRMLead:
        lead = models.CRMLead(tenant_id=self.tenant_id, **payload.model_dump())
        self.db.add(lead)
        self.db.commit()
        self.db.refresh(lead)
        return lead

    # Deal operations -----------------------------------------------------
    def list_deals(self) -> list[models.CRMDeal]:
        return (
            self.db.query(models.CRMDeal)
            .filter(models.CRMDeal.tenant_id == self.tenant_id)
            .order_by(models.CRMDeal.created_at.desc())
            .all()
        )

    def create_deal(self, payload: DealCreate) -> models.CRMDeal:
        stage = self._stage_for_tenant(payload.stage_id)
        deal = models.CRMDeal(tenant_id=self.tenant_id, **payload.model_dump())
        if stage.pipeline_id != payload.pipeline_id:
            raise AppError("invalid_stage", "Stage does not belong to the specified pipeline")
        self.db.add(deal)
        self.db.commit()
        self.db.refresh(deal)
        return deal

    def advance_stage(self, deal_id: int, stage_id: int) -> tuple[models.CRMDeal, AutomationResult | None]:
        deal = self._deal_for_tenant(deal_id)
        stage = self._stage_for_tenant(stage_id)
        if stage.pipeline_id != deal.pipeline_id:
            raise AppError("invalid_stage", "Stage does not belong to the deal pipeline")
        deal.stage_id = stage_id
        deal.updated_at = datetime.utcnow()

        automation: AutomationResult | None = None
        if stage.automation_flow:
            context = {
                "tenant_id": self.tenant_id,
                "deal_id": deal.id,
                "pipeline_id": deal.pipeline_id,
                "stage_id": stage_id,
                "title": deal.title,
                "value": float(deal.value or 0),
            }
            status = "queued"
            workflow_id = stage.automation_flow
            completed_at = None
            engine_context: dict[str, object] | None = None
            if default_engine:
                try:
                    run = default_engine.trigger(stage.automation_flow, context)
                    automation = AutomationResult(
                        workflow_id=run.workflow_id,
                        trigger=stage.automation_flow,
                        status=run.status,
                        run_id=run.run_id,
                        completed_at=run.completed_at,
                    )
                    status = run.status
                    workflow_id = run.workflow_id
                    completed_at = run.completed_at
                    engine_context = run.context
                except Exception as exc:  # pragma: no cover - defensive safeguard
                    status = "failed"
                    engine_context = {"error": str(exc)}
            run_log = models.CRMAutomationRun(
                tenant_id=self.tenant_id,
                deal_id=deal.id,
                trigger=stage.automation_flow,
                workflow_id=workflow_id,
                status=status,
                context=json.dumps(engine_context or context),
                completed_at=completed_at,
            )
            self.db.add(run_log)
        self.db.commit()
        self.db.refresh(deal)
        return deal, automation

    # Activity operations -------------------------------------------------
    def log_activity(self, payload: ActivityCreate) -> models.CRMActivity:
        deal = self._deal_for_tenant(payload.deal_id)
        activity = models.CRMActivity(
            tenant_id=self.tenant_id,
            deal_id=deal.id,
            activity_type=payload.activity_type,
            summary=payload.summary,
            payload=payload.payload,
            occurred_at=payload.occurred_at or datetime.utcnow(),
        )
        self.db.add(activity)
        self.db.commit()
        self.db.refresh(activity)
        return activity

    def list_activities(self, deal_id: int) -> list[models.CRMActivity]:
        self._deal_for_tenant(deal_id)
        return (
            self.db.query(models.CRMActivity)
            .filter(
                models.CRMActivity.tenant_id == self.tenant_id,
                models.CRMActivity.deal_id == deal_id,
            )
            .order_by(models.CRMActivity.occurred_at.desc())
            .all()
        )

    def list_automation_runs(self, deal_id: int) -> list[models.CRMAutomationRun]:
        self._deal_for_tenant(deal_id)
        return (
            self.db.query(models.CRMAutomationRun)
            .filter(
                models.CRMAutomationRun.tenant_id == self.tenant_id,
                models.CRMAutomationRun.deal_id == deal_id,
            )
            .order_by(models.CRMAutomationRun.created_at.desc())
            .all()
        )

    # Internal helpers ----------------------------------------------------
    def _deal_for_tenant(self, deal_id: int) -> models.CRMDeal:
        deal = (
            self.db.query(models.CRMDeal)
            .filter(
                models.CRMDeal.id == deal_id,
                models.CRMDeal.tenant_id == self.tenant_id,
            )
            .one_or_none()
        )
        if not deal:
            raise AppError("deal_not_found", "Deal not found")
        return deal

    def _stage_for_tenant(self, stage_id: int) -> models.CRMPipelineStage:
        stage = (
            self.db.query(models.CRMPipelineStage)
            .join(models.CRMPipeline, models.CRMPipeline.id == models.CRMPipelineStage.pipeline_id)
            .filter(
                models.CRMPipelineStage.id == stage_id,
                models.CRMPipeline.tenant_id == self.tenant_id,
            )
            .one_or_none()
        )
        if not stage:
            raise AppError("stage_not_found", "Stage not found for tenant")
        return stage


def serialize_lead(lead: models.CRMLead) -> LeadOut:
    return LeadOut.model_validate(lead)


def serialize_deal(deal: models.CRMDeal) -> DealOut:
    return DealOut.model_validate(deal)


def serialize_activities(activities: Iterable[models.CRMActivity]):
    for activity in activities:
        yield {
            "id": activity.id,
            "activity_type": activity.activity_type,
            "summary": activity.summary,
            "payload": activity.payload,
            "occurred_at": activity.occurred_at,
            "created_at": activity.created_at,
        }
