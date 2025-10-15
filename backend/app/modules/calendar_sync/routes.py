from fastapi import APIRouter, Depends, Query
from app.modules.auth.deps import require_role, get_db
from sqlalchemy.orm import Session

from .schemas import (
    CalendarAccountCreate,
    CalendarAccountOut,
    CalendarSyncRequest,
    CalendarSyncResult,
    OAuthConnectResponse,
    TokenExchangeIn,
)
from .usecases import CalendarSyncService

router = APIRouter()


@router.get("/calendars/accounts", response_model=list[CalendarAccountOut])
def list_accounts(
    include_all: bool = Query(False, description="Toon alle accounts (admin-only)"),
    db: Session = Depends(get_db),
    user=Depends(require_role("admin", "planner", "crew")),
):
    service = CalendarSyncService(db)
    if include_all and user.role == "admin":
        return service.list_accounts()
    return service.list_accounts(user_id=user.id)


@router.post("/calendars/connect", response_model=OAuthConnectResponse)
def connect_calendar(
    payload: CalendarAccountCreate,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin", "planner", "crew")),
):
    service = CalendarSyncService(db)
    return service.start_connection(user_id=user.id, payload=payload)


@router.post("/calendars/token", response_model=CalendarAccountOut)
def exchange_token(
    payload: TokenExchangeIn,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin", "planner", "crew")),
):
    service = CalendarSyncService(db)
    return service.exchange_token(user_id=user.id, payload=payload)


@router.post("/calendars/sync", response_model=CalendarSyncResult)
def sync_calendars(
    payload: CalendarSyncRequest,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin", "planner")),
):
    service = CalendarSyncService(db)
    return service.sync_bookings(user_id=user.id, request=payload)
