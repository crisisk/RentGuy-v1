from __future__ import annotations

from collections.abc import Generator
from dataclasses import dataclass
from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Ensure models are imported so metadata is populated before accessing the FastAPI app
import app.modules.inventory.models  # noqa: F401
import app.modules.projects.models  # noqa: F401

from app.core.db import Base
from app.main import app
from app.modules.auth import deps as auth_deps


def create_test_engine():
    return create_engine(
        'sqlite://',
        connect_args={'check_same_thread': False},
        poolclass=StaticPool,
    )


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_test_engine()
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@dataclass
class DummyUser:
    role: str
    email: str = 'test@rentguy.local'


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            db_session.rollback()

    app.dependency_overrides[auth_deps.get_db] = override_get_db
    app.dependency_overrides[auth_deps.get_current_user] = lambda: DummyUser(role='admin')

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
