"""Mock builders for CRM dashboard analytics responses."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from app.modules.crm.schemas import DashboardSummary


def build_dashboard_summary() -> DashboardSummary:
    """Return a deterministic dashboard summary for mock environments."""

    now = datetime.utcnow()
    payload: dict[str, Any] = {
        "generated_at": now,
        "headline": {
            "total_pipeline_value": 125_000.0,
            "weighted_pipeline_value": 64_000.0,
            "won_value_last_30_days": 32_000.0,
            "avg_deal_cycle_days": 18.5,
            "automation_failure_rate": 0.01,
            "active_workflows": 3,
        },
        "lead_funnel": {
            "total_leads": 240,
            "leads_last_30_days": 32,
            "leads_with_deals": 78,
            "conversion_rate": 0.325,
        },
        "pipeline": [
            {
                "stage_id": 1,
                "stage_name": "Intake",
                "deal_count": 12,
                "total_value": 22_000.0,
                "weighted_value": 9_500.0,
                "avg_age_days": 3.2,
            },
            {
                "stage_id": 2,
                "stage_name": "Proposal",
                "deal_count": 8,
                "total_value": 34_500.0,
                "weighted_value": 18_200.0,
                "avg_age_days": 5.6,
            },
        ],
        "automation": [
            {
                "workflow_id": "lead_intake",
                "run_count": 54,
                "failed_runs": 1,
                "avg_completion_minutes": 4.5,
                "sla_breaches": 0,
                "failure_rate": 0.018,
            },
            {
                "workflow_id": "proposal_followup",
                "run_count": 32,
                "failed_runs": 0,
                "avg_completion_minutes": 3.8,
                "sla_breaches": 1,
                "failure_rate": 0.0,
            },
        ],
        "sales": {
            "open_deals": 32,
            "won_deals_last_30_days": 6,
            "lost_deals_last_30_days": 3,
            "total_deals": 120,
            "bookings_last_30_days": 4,
            "win_rate": 0.42,
            "avg_deal_value": 5_200.0,
            "forecast_next_30_days": 18_500.0,
            "pipeline_velocity_per_day": 2_100.0,
        },
        "acquisition": {
            "lookback_days": 30,
            "ga_sessions": 4_200,
            "ga_new_users": 1_800,
            "ga_engaged_sessions": 3_900,
            "ga_conversions": 96,
            "ga_conversion_value": 28_500.0,
            "gtm_conversions": 54,
            "gtm_conversion_value": 18_300.0,
            "blended_conversion_rate": 0.032,
            "active_connectors": ["ga4", "gtm"],
        },
        "source_performance": [
            {
                "key": "google_ads",
                "label": "Google Ads",
                "dimension_type": "channel",
                "lead_count": 54,
                "deal_count": 24,
                "won_deal_count": 12,
                "pipeline_value": 42_000.0,
                "won_value": 21_000.0,
                "ga_sessions": 1_800,
                "ga_conversions": 36,
                "gtm_conversions": 18,
                "ga_revenue": 12_000.0,
                "gtm_revenue": 6_000.0,
            },
            {
                "key": "referral_partner",
                "label": "Referral Partners",
                "dimension_type": "lead_source",
                "lead_count": 18,
                "deal_count": 9,
                "won_deal_count": 5,
                "pipeline_value": 18_000.0,
                "won_value": 9_000.0,
                "ga_sessions": 0,
                "ga_conversions": 0,
                "gtm_conversions": 0,
                "ga_revenue": 0.0,
                "gtm_revenue": 0.0,
            },
        ],
        "provenance": {
            "source": "mock",
            "upstream_systems": ["crm", "ga4", "gtm"],
            "last_refreshed_at": now,
        },
    }

    return DashboardSummary.model_validate(payload)
