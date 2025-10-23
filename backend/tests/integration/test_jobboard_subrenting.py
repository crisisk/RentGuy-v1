from __future__ import annotations

import contextvars
from datetime import datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.db import Base, get_async_session
from app.main import app
from app.modules.auth.deps import get_current_user
from app.modules.auth.models import User
from app.modules.jobboard.models import JobApplication, JobPosting
from app.modules.subrenting.models import PartnerAvailability, PartnerCapacity, SubRentingPartner
from app.modules.subrenting.partner_api import PartnerAPIClient

current_user_ctx: contextvars.ContextVar[User] = contextvars.ContextVar("current_user")


def _override_current_user() -> User:
    try:
        return current_user_ctx.get()
    except LookupError as exc:  # pragma: no cover - defensive guard
        raise RuntimeError("current_user not set for test request") from exc


@pytest.fixture
async def app_context():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(engine, expire_on_commit=False)

    async def override_session() -> AsyncSession:
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_async_session] = override_session
    app.dependency_overrides[get_current_user] = _override_current_user

    try:
        yield {"session_maker": session_maker}
    finally:
        app.dependency_overrides.clear()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()


async def _create_user(session: AsyncSession, email: str, role: str) -> User:
    user = User(email=email, password_hash="x", role=role)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest.mark.anyio("asyncio")
async def test_jobboard_and_subrenting_flows(app_context, monkeypatch):
    session_maker: async_sessionmaker[AsyncSession] = app_context["session_maker"]

    async with session_maker() as session:
        employer = await _create_user(session, "employer@example.com", "admin")
        applicant = await _create_user(session, "applicant@example.com", "crew")

    async def _mock_sync(self, availabilities):  # pragma: no cover - network guard
        return None

    monkeypatch.setattr(PartnerAPIClient, "sync_availability", _mock_sync, raising=False)

    async with AsyncClient(app=app, base_url="http://test") as client:
        token = current_user_ctx.set(employer)
        posting_payload = {
            "title": "Stagehand",
            "description": "Assist with concert setup and teardown tasks.",
            "location": "Amsterdam",
        }
        response = await client.post("/api/v1/jobs/postings", json=posting_payload)
        current_user_ctx.reset(token)
        assert response.status_code == 201, response.text
        job_id = response.json()["id"]

        token = current_user_ctx.set(applicant)
        application_payload = {
            "job_posting_id": job_id,
            "resume_file_path": "s3://bucket/resume.pdf",
        }
        application_response = await client.post(
            "/api/v1/jobs/applications", json=application_payload
        )
        current_user_ctx.reset(token)
        assert application_response.status_code == 201, application_response.text
        application_id = application_response.json()["id"]

        token = current_user_ctx.set(employer)
        status_response = await client.patch(
            f"/api/v1/jobs/applications/{application_id}/status",
            json={"status": "under_review"},
        )
        assert status_response.status_code == 200, status_response.text

        list_response = await client.get(
            "/api/v1/jobs/applications", params={"job_id": job_id}
        )
        current_user_ctx.reset(token)
        assert list_response.status_code == 200
        assert len(list_response.json()) == 1
        assert list_response.json()[0]["status"] == "under_review"

        token = current_user_ctx.set(employer)
        partner_payload = {
            "name": "Backline BV",
            "api_endpoint": "https://partners.example/api",
            "api_key": "secret",
            "contact_email": "ops@backline.test",
            "location": "POINT(4.9 52.37)",
        }
        partner_response = await client.post(
            "/api/v1/subrenting/partners", json=partner_payload
        )
        assert partner_response.status_code == 201, partner_response.text
        partner_id = partner_response.json()["id"]

        capacity_payload = {
            "vehicle_type": "van",
            "quantity": 5,
            "price_per_unit": 95.0,
            "currency": "EUR",
            "valid_from": datetime.utcnow().isoformat(),
            "valid_to": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        }
        capacity_response = await client.post(
            f"/api/v1/subrenting/partners/{partner_id}/capacities",
            json=capacity_payload,
        )
        assert capacity_response.status_code == 201, capacity_response.text

        availability_payload = {
            "start_time": datetime.utcnow().isoformat(),
            "end_time": (datetime.utcnow() + timedelta(hours=4)).isoformat(),
            "status": "available",
        }
        availability_response = await client.post(
            f"/api/v1/subrenting/partners/{partner_id}/availability",
            json=availability_payload,
        )
        current_user_ctx.reset(token)
        assert availability_response.status_code == 201, availability_response.text

    async with session_maker() as verify_session:
        posting_count = await verify_session.scalar(
            select(func.count()).select_from(JobPosting)
        )
        application_count = await verify_session.scalar(
            select(func.count()).select_from(JobApplication)
        )
        partner_count = await verify_session.scalar(
            select(func.count()).select_from(SubRentingPartner)
        )
        capacity_count = await verify_session.scalar(
            select(func.count()).select_from(PartnerCapacity)
        )
        availability_count = await verify_session.scalar(
            select(func.count()).select_from(PartnerAvailability)
        )

    assert posting_count == 1
    assert application_count == 1
    assert partner_count == 1
    assert capacity_count == 1
    assert availability_count == 1
