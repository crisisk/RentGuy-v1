from __future__ import annotations

import jwt
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auth import deps as auth_deps
from app.modules.auth.models import User
from app.modules.auth.sso import AzureB2CSSOClient, SSOStateStore


class _DummyAzureClient(AzureB2CSSOClient):
    def __init__(self) -> None:
        super().__init__(
            authority="https://login.test/tenant", client_id="dummy", scope="openid profile email"
        )

    async def exchange_code(self, *, code: str, redirect_uri: str, code_verifier: str) -> dict[str, str]:
        assert code == "dummy-code"
        assert redirect_uri.endswith("/auth/callback")
        assert code_verifier
        token = jwt.encode(
            {
                "email": "bart@mr-dj.nl",
                "tenant": "tenant:mrdj",
                "roles": ["planner"],
            },
            "secret",
            algorithm="HS256",
        )
        return {"id_token": token}


def test_mrdj_sso_flow_creates_user_and_returns_session(
    client: TestClient, db_session: Session
) -> None:
    store = SSOStateStore(ttl_seconds=120)
    azure_client = _DummyAzureClient()

    app = client.app
    app.dependency_overrides[auth_deps.get_sso_state_store] = lambda: store
    app.dependency_overrides[auth_deps.get_sso_client] = lambda: azure_client

    try:
        login_resp = client.post(
            "/api/v1/auth/sso/login",
            json={"return_url": "https://mr-dj.nl/welcome"},
        )
        assert login_resp.status_code == 201
        login_payload = login_resp.json()
        state = login_payload["state"]
        assert "code_challenge" in login_payload

        callback_resp = client.post(
            "/api/v1/auth/sso/callback",
            json={"code": "dummy-code", "state": state},
            cookies={"mrdj_sso_state": state},
        )
        assert callback_resp.status_code == 200
        callback_payload = callback_resp.json()
        assert callback_payload["tenant"] == "mrdj"
        assert callback_payload["redirect_url"] == "https://mr-dj.nl/welcome"
        assert callback_payload["session_token"]

        user = db_session.execute(
            select(User).where(User.email == "bart@mr-dj.nl")
        ).scalar_one()
        assert user.role == "planner"
    finally:
        app.dependency_overrides.pop(auth_deps.get_sso_state_store, None)
        app.dependency_overrides.pop(auth_deps.get_sso_client, None)
