"""Domain service layer for CRM operations."""

from __future__ import annotations

import json
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Iterable

from sqlalchemy.orm import Session

from app.core.config import settings
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
        lookback_days = 30
        window_start = now - timedelta(days=lookback_days)
        forecast_end = now + timedelta(days=30)

        lead_query = (
            self.db.query(models.CRMLead)
            .filter(models.CRMLead.tenant_id == self.tenant_id)
        )
        leads = lead_query.all()
        total_leads = len(leads)
        leads_last_30 = sum(1 for lead in leads if lead.created_at >= window_start)
        converted_lead_ids: set[int] = set()

        deals = (
            self.db.query(models.CRMDeal)
            .filter(models.CRMDeal.tenant_id == self.tenant_id)
            .all()
        )

        total_pipeline_value = Decimal(0)
        weighted_pipeline_value = Decimal(0)
        won_value_last_30 = Decimal(0)
        cycle_lengths: list[float] = []
        open_deals = 0
        won_deals_last_30 = 0
        lost_deals_last_30 = 0
        total_deals = len(deals)
        forecast_next_30 = Decimal(0)

        for deal in deals:
            value = Decimal(deal.value or 0)
            probability = Decimal(deal.probability or 0)
            total_pipeline_value += value
            weighted_pipeline_value += (value * probability) / Decimal(100)

            if deal.lead_id is not None:
                converted_lead_ids.add(deal.lead_id)

            status = (deal.status or "").lower()
            if status == "won":
                if deal.updated_at:
                    if deal.updated_at >= window_start:
                        won_value_last_30 += value
                        won_deals_last_30 += 1
                    cycle_lengths.append(
                        (deal.updated_at - deal.created_at).total_seconds() / 86400.0
                    )
            elif status in {"lost", "closed_lost"}:
                if deal.updated_at and deal.updated_at >= window_start:
                    lost_deals_last_30 += 1
                if deal.updated_at:
                    cycle_lengths.append(
                        (deal.updated_at - deal.created_at).total_seconds() / 86400.0
                    )
            else:
                open_deals += 1

            if (
                deal.expected_close
                and now.date() <= deal.expected_close <= forecast_end.date()
            ):
                forecast_next_30 += (value * probability) / Decimal(100)

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

        acquisition_rows = (
            self.db.query(models.CRMAcquisitionMetric)
            .filter(
                models.CRMAcquisitionMetric.tenant_id == self.tenant_id,
                models.CRMAcquisitionMetric.captured_date >= window_start.date(),
                models.CRMAcquisitionMetric.captured_date <= now.date(),
            )
            .all()
        )

        total_ga_sessions = sum(row.sessions or 0 for row in acquisition_rows)
        total_ga_new_users = sum(row.new_users or 0 for row in acquisition_rows)
        total_ga_engaged = sum(row.engaged_sessions or 0 for row in acquisition_rows)
        total_ga_conversions = sum(row.ga_conversions or 0 for row in acquisition_rows)
        total_ga_value = sum(Decimal(row.ga_conversion_value or 0) for row in acquisition_rows)
        total_gtm_conversions = sum(row.gtm_conversions or 0 for row in acquisition_rows)
        total_gtm_value = sum(
            Decimal(row.gtm_conversion_value or 0) for row in acquisition_rows
        )
        blended_conversion_rate = (
            (total_ga_conversions + total_gtm_conversions) / total_ga_sessions
            if total_ga_sessions
            else 0.0
        )

        tenant_sources = getattr(settings, "CRM_ANALYTICS_SOURCES", {}) or {}
        tenant_config = tenant_sources.get(self.tenant_id, {})
        active_connectors: list[str] = []
        if tenant_config.get("ga4_property_id"):
            active_connectors.append("ga4")
        if tenant_config.get("gtm_container_id"):
            active_connectors.append("gtm")

        acquisition_metrics = {
            "lookback_days": lookback_days,
            "ga_sessions": total_ga_sessions,
            "ga_new_users": total_ga_new_users,
            "ga_engaged_sessions": total_ga_engaged,
            "ga_conversions": total_ga_conversions,
            "ga_conversion_value": float(total_ga_value),
            "gtm_conversions": total_gtm_conversions,
            "gtm_conversion_value": float(total_gtm_value),
            "blended_conversion_rate": round(blended_conversion_rate, 4),
            "active_connectors": active_connectors,
        }

        closed_last_30 = won_deals_last_30 + lost_deals_last_30
        win_rate = won_deals_last_30 / closed_last_30 if closed_last_30 else 0.0
        avg_deal_value = (
            (total_pipeline_value / Decimal(total_deals)) if total_deals else None
        )
        pipeline_velocity = (
            (won_value_last_30 / Decimal(lookback_days)) if lookback_days else Decimal(0)
        )

        sales_metrics = {
            "open_deals": open_deals,
            "won_deals_last_30_days": won_deals_last_30,
            "lost_deals_last_30_days": lost_deals_last_30,
            "total_deals": total_deals,
            "bookings_last_30_days": won_deals_last_30,
            "win_rate": round(win_rate, 4),
            "avg_deal_value": float(avg_deal_value) if avg_deal_value is not None else None,
            "forecast_next_30_days": float(forecast_next_30),
            "pipeline_velocity_per_day": round(float(pipeline_velocity), 2),
        }

        def _source_default() -> dict[str, object]:
            return {
                "lead_count": 0,
                "deal_count": 0,
                "won_deal_count": 0,
                "pipeline_value": Decimal(0),
                "won_value": Decimal(0),
                "ga_sessions": 0,
                "ga_conversions": 0,
                "gtm_conversions": 0,
                "ga_revenue": Decimal(0),
                "gtm_revenue": Decimal(0),
            }

        source_metrics: defaultdict[str, dict[str, object]] = defaultdict(_source_default)
        source_labels: dict[str, str] = {}
        source_types: dict[str, str] = {}

        for lead in leads:
            key = (lead.source or "Direct/Other").strip().lower()
            metrics = source_metrics[key]
            metrics["lead_count"] += 1
            source_labels.setdefault(key, lead.source or "Direct/Other")
            source_types.setdefault(key, "lead_source")

        for deal in deals:
            lead_source = (deal.lead.source if deal.lead and deal.lead.source else None)
            if lead_source:
                key = lead_source.strip().lower()
                label = lead_source
                dimension_type = "lead_source"
            else:
                key = "pipeline"
                label = "Pipeline"
                dimension_type = "internal"
            metrics = source_metrics[key]
            deal_value = Decimal(deal.value or 0)
            metrics["deal_count"] += 1
            metrics["pipeline_value"] += deal_value
            if (deal.status or "").lower() == "won":
                metrics["won_deal_count"] += 1
                metrics["won_value"] += deal_value
            source_labels.setdefault(key, label)
            source_types.setdefault(key, dimension_type)

        for row in acquisition_rows:
            key_source = (row.source or row.channel or "ga/other").strip().lower()
            label = row.source or row.channel or "GA Other"
            dimension_type = "ga_source" if row.source else "ga_channel"
            metrics = source_metrics[key_source]
            metrics["ga_sessions"] += row.sessions or 0
            metrics["ga_conversions"] += row.ga_conversions or 0
            metrics["gtm_conversions"] += row.gtm_conversions or 0
            metrics["ga_revenue"] += Decimal(row.ga_conversion_value or 0)
            metrics["gtm_revenue"] += Decimal(row.gtm_conversion_value or 0)
            source_labels.setdefault(key_source, label)
            source_types.setdefault(key_source, dimension_type)

        source_performance: list[dict[str, object]] = []
        for key, metrics in source_metrics.items():
            if not (
                metrics["lead_count"]
                or metrics["deal_count"]
                or metrics["ga_sessions"]
                or metrics["ga_conversions"]
                or metrics["gtm_conversions"]
            ):
                continue
            source_performance.append(
                {
                    "key": key,
                    "label": source_labels.get(key, key.title()),
                    "dimension_type": source_types.get(key, "lead_source"),
                    "lead_count": metrics["lead_count"],
                    "deal_count": metrics["deal_count"],
                    "won_deal_count": metrics["won_deal_count"],
                    "pipeline_value": float(metrics["pipeline_value"]),
                    "won_value": float(metrics["won_value"]),
                    "ga_sessions": metrics["ga_sessions"],
                    "ga_conversions": metrics["ga_conversions"],
                    "gtm_conversions": metrics["gtm_conversions"],
                    "ga_revenue": float(metrics["ga_revenue"]),
                    "gtm_revenue": float(metrics["gtm_revenue"]),
                }
            )
        source_performance.sort(key=lambda row: row["label"].lower())

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

        provenance = {
            "source": "live",
            "upstream_systems": list(dict.fromkeys(["crm", *active_connectors])),
            "last_refreshed_at": now,
        }

        return {
            "generated_at": now,
            "headline": headline,
            "lead_funnel": lead_funnel,
            "pipeline": pipeline_metrics,
            "automation": automation_metrics,
            "sales": sales_metrics,
            "acquisition": acquisition_metrics,
            "source_performance": source_performance,
            "provenance": provenance,
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
