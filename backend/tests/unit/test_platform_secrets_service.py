from __future__ import annotations

from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.modules.platform.secrets.models import PlatformSecret
from app.modules.platform.secrets.repo import PlatformSecretRepo
from app.modules.platform.secrets.service import PlatformSecretService


@pytest.fixture(scope="module", autouse=True)
def _load_related_models() -> None:
    """Ensure string-based relationship lookups resolve during mapper config."""

    # Import models that declare relationships against ``auth.User`` so the
    # SQLAlchemy registry knows about them before the test metadata is bound.
    import app.modules.auth.models  # noqa: F401  (registers ``User``)
    import app.modules.customer_portal.models  # noqa: F401  (UserProfile, etc.)
    import app.modules.recurring_invoices.models  # noqa: F401


@pytest.fixture()
def secrets_session() -> Session:
    engine = create_engine(
        'sqlite://',
        connect_args={'check_same_thread': False},
        poolclass=StaticPool,
    )
    PlatformSecret.__table__.create(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def _service(db_session: Session, tmp_path: Path | None = None) -> PlatformSecretService:
    repo = PlatformSecretRepo(db_session)
    env_path = tmp_path / '.env.secrets' if tmp_path is not None else None
    return PlatformSecretService(repo, env_path=env_path)


def test_list_secrets_bootstraps_defaults(secrets_session: Session) -> None:
    service = _service(secrets_session)
    secrets = service.list_secrets()
    secrets_session.commit()

    keys = {secret.key for secret in secrets}
    assert 'DATABASE_URL' in keys
    assert 'SMTP_HOST' in keys
    smtp = next(secret for secret in secrets if secret.key == 'SMTP_HOST')
    assert smtp.category == 'email'


def test_update_secret_records_hint(secrets_session: Session) -> None:
    service = _service(secrets_session)
    updated = service.update_secret('SMTP_HOST', 'smtp.example.com')
    secrets_session.commit()

    assert updated.has_value is True
    assert updated.value_hint.endswith('om')


def test_sync_to_env_writes_file(secrets_session: Session, tmp_path) -> None:
    service = _service(secrets_session, tmp_path)
    service.update_secret('SMTP_HOST', 'smtp.example.com')
    service.update_secret('MAIL_FROM', 'no-reply@example.com')
    secrets_session.commit()

    result = service.sync_to_env()
    secrets_session.commit()

    assert result.applied >= 2
    env_file = tmp_path / '.env.secrets'
    contents = env_file.read_text(encoding='utf-8')
    assert 'SMTP_HOST=smtp.example.com' in contents
    assert 'MAIL_FROM=no-reply@example.com' in contents


def test_email_diagnostics_reports_status(secrets_session: Session) -> None:
    service = _service(secrets_session)

    diagnostics = service.email_diagnostics()
    assert diagnostics.status == 'error'
    assert 'SMTP_HOST' in diagnostics.missing

    service.update_secret('SMTP_HOST', 'smtp.example.com')
    service.update_secret('SMTP_PORT', '587')
    service.update_secret('MAIL_FROM', 'ops@example.com')
    service.update_secret('SMTP_USER', 'user')
    service.update_secret('SMTP_PASS', 'secret')
    secrets_session.commit()

    ready = service.email_diagnostics()
    assert ready.status == 'ok'
    assert ready.node_ready is True
    assert ready.auth_configured is True
