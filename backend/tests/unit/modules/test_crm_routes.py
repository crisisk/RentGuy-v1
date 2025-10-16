from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.crm import models

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
