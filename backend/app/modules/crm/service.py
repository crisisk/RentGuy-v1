"""Domain service layer for CRM operations."""

from __future__ import annotations

import json
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Iterable

from sqlalchemy.orm import Session

from app.core.errors import AppError

from . import models
from .schemas import (
    ActivityCreate,
    DealCreate,
    DealOut,
    LeadCaptureSubmission,
    LeadCreate,
    LeadOut,
)

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

    def ingest_public_lead(self, payload: LeadCaptureSubmission) -> tuple[models.CRMLead, bool]:
        full_name = f"{payload.first_name} {payload.last_name}".strip()
        lead_payload = LeadCreate(
            name=full_name,
            email=payload.email,
            phone=payload.phone,
            source=payload.source or "website_form",
            status="new",
        )
        lead = models.CRMLead(tenant_id=self.tenant_id, **lead_payload.model_dump())
        self.db.add(lead)
        self.db.commit()
        self.db.refresh(lead)

        triggered = False
        if default_engine:
            context = {
                "tenant_id": self.tenant_id,
                "lead_id": lead.id,
                "email": lead.email,
                "source": lead.source,
                "marketing_opt_in": payload.marketing_opt_in,
                "utm": {
                    "source": payload.utm_source,
                    "medium": payload.utm_medium,
                    "campaign": payload.utm_campaign,
                },
                "message": payload.message,
            }
            try:
                default_engine.trigger("lead_intake", context)
                triggered = True
            except Exception:  # pragma: no cover - defensive safeguard
                triggered = False

        return lead, triggered

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

    def dashboard_metrics(self) -> dict[str, object]:
        now = datetime.utcnow()
        window_start = now - timedelta(days=30)

        lead_query = self.db.query(models.CRMLead).filter(models.CRMLead.tenant_id == self.tenant_id)
        total_leads = lead_query.count()
        leads_last_30 = lead_query.filter(models.CRMLead.created_at >= window_start).count()

        deals = (
            self.db.query(models.CRMDeal)
            .filter(models.CRMDeal.tenant_id == self.tenant_id)
            .all()
        )

        total_pipeline_value = Decimal(0)
        weighted_pipeline_value = Decimal(0)
        converted_lead_ids: set[int] = set()
        won_value_last_30 = Decimal(0)
        cycle_lengths: list[float] = []

        for deal in deals:
            value = Decimal(deal.value or 0)
            probability = Decimal(deal.probability or 0)
            total_pipeline_value += value
            weighted_pipeline_value += (value * probability) / Decimal(100)

            if deal.lead_id is not None:
                converted_lead_ids.add(deal.lead_id)

            status = (deal.status or "").lower()
            if status == "won" and deal.updated_at:
                if deal.updated_at >= window_start:
                    won_value_last_30 += value
                cycle_lengths.append((deal.updated_at - deal.created_at).total_seconds() / 86400.0)

        stage_rows = (
            self.db.query(
                models.CRMPipelineStage.id,
                models.CRMPipelineStage.name,
                models.CRMPipelineStage.order,
            )
            .join(models.CRMPipeline, models.CRMPipeline.id == models.CRMPipelineStage.pipeline_id)
            .filter(models.CRMPipeline.tenant_id == self.tenant_id)
            .all()
        )
        stage_index = {row.id: {"name": row.name, "order": row.order} for row in stage_rows}

        deals_by_stage: dict[int, list[models.CRMDeal]] = defaultdict(list)
        for deal in deals:
            deals_by_stage[deal.stage_id].append(deal)

        pipeline_metrics: list[dict[str, object]] = []
        for stage_id, info in sorted(stage_index.items(), key=lambda item: item[1]["order"]):
            stage_deals = deals_by_stage.get(stage_id, [])
            total_value = sum((Decimal(d.value or 0) for d in stage_deals), Decimal(0))
            weighted_value = sum(
                (Decimal(d.value or 0) * Decimal(d.probability or 0) / Decimal(100))
                for d in stage_deals
            )
            avg_age_days = None
            if stage_deals:
                avg_age_days = sum(
                    (now - d.created_at).total_seconds() / 86400.0 for d in stage_deals
                ) / len(stage_deals)

            pipeline_metrics.append(
                {
                    "stage_id": stage_id,
                    "stage_name": info["name"],
                    "deal_count": len(stage_deals),
                    "total_value": float(total_value),
                    "weighted_value": float(weighted_value),
                    "avg_age_days": round(avg_age_days, 2) if avg_age_days is not None else None,
                }
            )

        sla_minutes = 10
        automation_runs = (
            self.db.query(models.CRMAutomationRun)
            .filter(models.CRMAutomationRun.tenant_id == self.tenant_id)
            .all()
        )
        runs_by_workflow: dict[str, dict[str, object]] = defaultdict(
            lambda: {"run_count": 0, "failed_runs": 0, "durations": [], "sla_breaches": 0}
        )
        for run in automation_runs:
            workflow_metrics = runs_by_workflow[run.workflow_id]
            workflow_metrics["run_count"] += 1
            status = (run.status or "").lower()
            if status == "failed":
                workflow_metrics["failed_runs"] += 1
            if run.completed_at:
                duration = (run.completed_at - run.created_at).total_seconds() / 60.0
                workflow_metrics["durations"].append(duration)
                if duration > sla_minutes:
                    workflow_metrics["sla_breaches"] += 1

        automation_metrics: list[dict[str, object]] = []
        total_run_count = 0
        total_failed_runs = 0
        for workflow_id in sorted(runs_by_workflow.keys()):
            metrics = runs_by_workflow[workflow_id]
            run_count = int(metrics["run_count"])
            failed_runs = int(metrics["failed_runs"])
            durations = metrics["durations"]
            sla_breaches = int(metrics["sla_breaches"])

            avg_completion = None
            if durations:
                avg_completion = sum(durations) / len(durations)

            failure_rate = failed_runs / run_count if run_count else 0.0
            automation_metrics.append(
                {
                    "workflow_id": workflow_id,
                    "run_count": run_count,
                    "failed_runs": failed_runs,
                    "avg_completion_minutes": round(avg_completion, 2) if avg_completion is not None else None,
                    "sla_breaches": sla_breaches,
                    "failure_rate": round(failure_rate, 4),
                }
            )
            total_run_count += run_count
            total_failed_runs += failed_runs

        overall_failure_rate = total_failed_runs / total_run_count if total_run_count else 0.0
        avg_cycle_days = sum(cycle_lengths) / len(cycle_lengths) if cycle_lengths else None

        headline = {
            "total_pipeline_value": float(total_pipeline_value),
            "weighted_pipeline_value": float(weighted_pipeline_value),
            "won_value_last_30_days": float(won_value_last_30),
            "avg_deal_cycle_days": round(avg_cycle_days, 2) if avg_cycle_days is not None else None,
            "automation_failure_rate": round(overall_failure_rate, 4),
            "active_workflows": len(automation_metrics),
        }

        lead_funnel = {
            "total_leads": total_leads,
            "leads_last_30_days": leads_last_30,
            "leads_with_deals": len(converted_lead_ids),
            "conversion_rate": round(len(converted_lead_ids) / total_leads, 4) if total_leads else 0.0,
        }

        return {
            "generated_at": now,
            "headline": headline,
            "lead_funnel": lead_funnel,
            "pipeline": pipeline_metrics,
            "automation": automation_metrics,
        }

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
