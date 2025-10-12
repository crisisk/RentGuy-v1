from sqlalchemy.orm import Session

from app.modules.auth import deps as auth_deps
from app.modules.auth.models import User


def test_pending_user_can_select_role(client, db_session: Session):
    user = User(email="new-user@rentguy.demo", password_hash="x", role="pending")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    client.app.dependency_overrides[auth_deps.get_current_user] = lambda: user
    try:
        response = client.post("/api/v1/auth/role", json={"role": "planner"})

        assert response.status_code == 200
        payload = response.json()
        assert payload["role"] == "planner"

        db_session.refresh(user)
        assert user.role == "planner"
    finally:
        client.app.dependency_overrides.pop(auth_deps.get_current_user, None)


def test_non_pending_user_cannot_change_role(client, db_session: Session):
    user = User(email="ops@rentguy.demo", password_hash="x", role="planner")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    client.app.dependency_overrides[auth_deps.get_current_user] = lambda: user
    try:
        response = client.post("/api/v1/auth/role", json={"role": "finance"})

        assert response.status_code == 403
        db_session.refresh(user)
        assert user.role == "planner"
    finally:
        client.app.dependency_overrides.pop(auth_deps.get_current_user, None)
