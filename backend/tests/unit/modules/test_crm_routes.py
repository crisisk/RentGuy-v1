from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
import pytest
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.crm import models
from app.modules.crm import deps as crm_deps

TENANT_ID = "mrdj"


def _seed_pipeline(db: Session) -> tuple[int, int, int]:
    pipeline = models.CRMPipeline(tenant_id=TENANT_ID, name="Default", is_default=True)
    stage_intake = models.CRMPipelineStage(
        name="Intake",
        order=1,
        automation_flow="lead_intake",
    )
    stage_proposal = models.CRMPipelineStage(
        name="Proposal",
        order=2,
        automation_flow="proposal_followup",
    )
    pipeline.stages.extend([stage_intake, stage_proposal])
    db.add(pipeline)
    db.commit()
    db.refresh(pipeline)
    db.refresh(stage_intake)
    db.refresh(stage_proposal)
    return pipeline.id, stage_intake.id, stage_proposal.id


def test_crm_lead_deal_flow(client: TestClient, db_session: Session) -> None:
    pipeline_id, stage_intake, stage_proposal = _seed_pipeline(db_session)

    lead_payload = {"name": "Bart", "email": "bart@example.com"}
    lead_resp = client.post(
        "/api/v1/crm/leads",
        json=lead_payload,
        headers={"X-Tenant-ID": TENANT_ID},
    )
    assert lead_resp.status_code == 201
    lead_id = lead_resp.json()["id"]

    deal_resp = client.post(
        "/api/v1/crm/deals",
        json={
            "title": "Bruiloft Bart",
            "lead_id": lead_id,
            "pipeline_id": pipeline_id,
            "stage_id": stage_intake,
            "value": 2500,
            "currency": "EUR",
        },
        headers={"X-Tenant-ID": TENANT_ID},
    )
    assert deal_resp.status_code == 201
    deal = deal_resp.json()
    assert deal["stage"]["automation_flow"] == "lead_intake"

    advance_resp = client.post(
        f"/api/v1/crm/deals/{deal['id']}/advance",
        json={"stage_id": stage_proposal},
        headers={"X-Tenant-ID": TENANT_ID},
    )
    assert advance_resp.status_code == 200
    updated = advance_resp.json()
    assert updated["stage_id"] == stage_proposal
    assert updated["stage"]["automation_flow"] == "proposal_followup"

    # Automation run should be logged
    runs_resp = client.get(
        f"/api/v1/crm/deals/{deal['id']}/automation",
        headers={"X-Tenant-ID": TENANT_ID},
    )
    assert runs_resp.status_code == 200
    runs = runs_resp.json()
    assert runs
    assert runs[0]["trigger"] == "proposal_followup"


def test_public_lead_capture_endpoint(client: TestClient, db_session: Session) -> None:
    app = client.app

    class _DummyCaptcha:
        async def verify(self, token: str, remote_ip: str | None = None) -> None:
            assert token == "captcha-token"

    limiter = crm_deps.LeadCaptureRateLimiter(limit=5, window_seconds=60)

    app.dependency_overrides[crm_deps.get_captcha_verifier] = lambda: _DummyCaptcha()
    app.dependency_overrides[crm_deps.get_rate_limiter] = lambda: limiter

    try:
        response = client.post(
            "/api/v1/public/leads",
            json={
                "tenant": "mrdj",
                "first_name": "Lead",
                "last_name": "Tester",
                "email": "lead@example.com",
                "captcha_token": "captcha-token",
                "utm_source": "google",
            },
        )
        assert response.status_code == 201
        payload = response.json()
        assert payload["status"] == "new"
        assert isinstance(payload["automation_triggered"], bool)

        lead = db_session.query(models.CRMLead).filter_by(email="lead@example.com").one()
        assert lead.source == "website_form"
    finally:
        app.dependency_overrides.pop(crm_deps.get_captcha_verifier, None)
        app.dependency_overrides.pop(crm_deps.get_rate_limiter, None)



def test_dashboard_metrics_endpoint(client: TestClient, db_session: Session) -> None:
    original_sources = settings.CRM_ANALYTICS_SOURCES
    settings.CRM_ANALYTICS_SOURCES = {
        TENANT_ID: {
            "ga4_property_id": "properties/test",
            "gtm_container_id": "GTM-TEST",
        }
    }

    try:
        now = datetime.utcnow()
        pipeline_id, stage_intake, stage_proposal = _seed_pipeline(db_session)

        lead_recent = models.CRMLead(
            tenant_id=TENANT_ID,
            name="Recent Lead",
            email="recent@example.com",
            source="mr-dj.nl",
            created_at=now - timedelta(days=5),
            updated_at=now - timedelta(days=5),
        )
        lead_old = models.CRMLead(
            tenant_id=TENANT_ID,
            name="Old Lead",
            email="old@example.com",
            source="referral_partner",
            created_at=now - timedelta(days=45),
            updated_at=now - timedelta(days=45),
        )
        db_session.add_all([lead_recent, lead_old])
        db_session.commit()
        db_session.refresh(lead_recent)
        db_session.refresh(lead_old)

        deal_open = models.CRMDeal(
            tenant_id=TENANT_ID,
            lead_id=lead_recent.id,
            pipeline_id=pipeline_id,
            stage_id=stage_intake,
            title="Open Deal",
            value=2000,
            probability=50,
            status="open",
            expected_close=(now + timedelta(days=10)).date(),
            created_at=now - timedelta(days=10),
            updated_at=now - timedelta(days=3),
        )
        deal_won = models.CRMDeal(
            tenant_id=TENANT_ID,
            lead_id=lead_old.id,
            pipeline_id=pipeline_id,
            stage_id=stage_proposal,
            title="Won Deal",
            value=3000,
            probability=100,
            status="won",
            expected_close=(now - timedelta(days=2)).date(),
            created_at=now - timedelta(days=20),
            updated_at=now - timedelta(days=1),
        )
        db_session.add_all([deal_open, deal_won])
        db_session.commit()
        db_session.refresh(deal_open)
        db_session.refresh(deal_won)

        acquisition_metric = models.CRMAcquisitionMetric(
            tenant_id=TENANT_ID,
            channel="Organic Search",
            source="mr-dj.nl",
            medium="organic",
            captured_date=now.date(),
            sessions=150,
            new_users=90,
            engaged_sessions=120,
            ga_conversions=15,
            ga_conversion_value=Decimal("5000.00"),
            gtm_conversions=5,
            gtm_conversion_value=Decimal("1200.00"),
            ga_property_id="properties/test",
            gtm_container_id="GTM-TEST",
        )
        db_session.add(acquisition_metric)
        db_session.commit()

        run_completed = models.CRMAutomationRun(
            tenant_id=TENANT_ID,
            deal_id=deal_won.id,
            trigger="proposal_followup",
            workflow_id="proposal_followup",
            status="completed",
            created_at=now - timedelta(minutes=8),
            completed_at=now - timedelta(minutes=3),
        )
        run_failed = models.CRMAutomationRun(
            tenant_id=TENANT_ID,
            deal_id=deal_open.id,
            trigger="lead_intake",
            workflow_id="lead_intake",
            status="failed",
            created_at=now - timedelta(minutes=4),
        )
        db_session.add_all([run_completed, run_failed])
        db_session.commit()

        response = client.get(
            "/api/v1/crm/analytics/dashboard", headers={"X-Tenant-ID": TENANT_ID}
        )
        assert response.status_code == 200
        payload = response.json()

        assert payload["headline"]["total_pipeline_value"] == pytest.approx(5000.0)
        assert payload["headline"]["weighted_pipeline_value"] == pytest.approx(4000.0)
        assert payload["headline"]["won_value_last_30_days"] == pytest.approx(3000.0)
        assert payload["headline"]["automation_failure_rate"] == pytest.approx(0.5)
        assert payload["headline"]["active_workflows"] == 2
        assert payload["headline"]["avg_deal_cycle_days"] == pytest.approx(19.0)
        assert payload["lead_funnel"]["total_leads"] == 2
        assert payload["lead_funnel"]["leads_last_30_days"] == 1
        assert payload["lead_funnel"]["leads_with_deals"] == 2
        assert payload["lead_funnel"]["conversion_rate"] == pytest.approx(1.0)

        pipeline_metrics = {row["stage_name"]: row for row in payload["pipeline"]}
        assert pipeline_metrics["Intake"]["deal_count"] == 1
        assert pipeline_metrics["Intake"]["weighted_value"] == pytest.approx(1000.0)
        assert pipeline_metrics["Proposal"]["total_value"] == pytest.approx(3000.0)

        automation_metrics = {row["workflow_id"]: row for row in payload["automation"]}
        assert automation_metrics["proposal_followup"]["avg_completion_minutes"] == pytest.approx(5.0)
        assert automation_metrics["proposal_followup"]["failure_rate"] == pytest.approx(0.0)
        assert automation_metrics["lead_intake"]["failure_rate"] == pytest.approx(1.0)
        assert automation_metrics["lead_intake"]["avg_completion_minutes"] is None

        sales = payload["sales"]
        assert sales["open_deals"] == 1
        assert sales["won_deals_last_30_days"] == 1
        assert sales["lost_deals_last_30_days"] == 0
        assert sales["total_deals"] == 2
        assert sales["bookings_last_30_days"] == 1
        assert sales["avg_deal_value"] == pytest.approx(2500.0)
        assert sales["forecast_next_30_days"] == pytest.approx(1000.0)
        assert sales["pipeline_velocity_per_day"] == pytest.approx(100.0)
        assert sales["win_rate"] == pytest.approx(1.0)

        acquisition = payload["acquisition"]
        assert acquisition["ga_sessions"] == 150
        assert acquisition["ga_new_users"] == 90
        assert acquisition["ga_engaged_sessions"] == 120
        assert acquisition["ga_conversions"] == 15
        assert acquisition["ga_conversion_value"] == pytest.approx(5000.0)
        assert acquisition["gtm_conversions"] == 5
        assert acquisition["gtm_conversion_value"] == pytest.approx(1200.0)
        assert acquisition["blended_conversion_rate"] == pytest.approx(0.1333)
        assert set(acquisition["active_connectors"]) == {"ga4", "gtm"}

        source_performance = {row["key"]: row for row in payload["source_performance"]}
        assert "mr-dj.nl" in source_performance
        assert source_performance["mr-dj.nl"]["lead_count"] == 1
        assert source_performance["mr-dj.nl"]["deal_count"] == 1
        assert source_performance["mr-dj.nl"]["ga_sessions"] == 150
        assert source_performance["mr-dj.nl"]["ga_conversions"] == 15
        assert source_performance["mr-dj.nl"]["gtm_conversions"] == 5
        assert source_performance["mr-dj.nl"]["pipeline_value"] == pytest.approx(2000.0)
        assert source_performance["mr-dj.nl"]["won_value"] == pytest.approx(0.0)

        assert "referral_partner" in source_performance
        assert source_performance["referral_partner"]["won_value"] == pytest.approx(3000.0)
        assert source_performance["referral_partner"]["deal_count"] == 1
        assert source_performance["referral_partner"]["ga_sessions"] == 0

        provenance = payload["provenance"]
        assert provenance["source"] == "live"
        assert "crm" in provenance["upstream_systems"]
        assert set(provenance["upstream_systems"]).issuperset({"crm", "ga4", "gtm"})
        assert provenance["last_refreshed_at"]
    finally:
        settings.CRM_ANALYTICS_SOURCES = original_sources
