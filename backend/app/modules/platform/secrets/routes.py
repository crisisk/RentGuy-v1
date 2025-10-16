"""API routes for the secrets dashboard."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.auth.deps import get_db, require_role

from .repo import PlatformSecretRepo
from .schemas import EmailDiagnosticsResponse, SecretOut, SecretSyncResponse, SecretUpdateRequest
from .service import PlatformSecretService

router = APIRouter(prefix="/secrets", dependencies=[Depends(require_role("admin"))])


def _service(db: Session) -> PlatformSecretService:
    return PlatformSecretService(PlatformSecretRepo(db))


@router.get("/", response_model=list[SecretOut])
def list_secrets(db: Session = Depends(get_db)) -> list[SecretOut]:
    service = _service(db)
    secrets = service.list_secrets()
    db.commit()
    return secrets


@router.put("/{key}", response_model=SecretOut)
def update_secret(key: str, payload: SecretUpdateRequest, db: Session = Depends(get_db)) -> SecretOut:
    service = _service(db)
    raw_value = payload.value.get_secret_value() if payload.value is not None else None
    secret = service.update_secret(key, raw_value)
    db.commit()
    return secret


@router.post("/sync", response_model=SecretSyncResponse)
def sync_secrets(db: Session = Depends(get_db)) -> SecretSyncResponse:
    service = _service(db)
    result = service.sync_to_env()
    db.commit()
    return result


@router.get("/email/diagnostics", response_model=EmailDiagnosticsResponse)
def email_diagnostics(db: Session = Depends(get_db)) -> EmailDiagnosticsResponse:
    service = _service(db)
    diagnostics = service.email_diagnostics()
    db.commit()
    return diagnostics
