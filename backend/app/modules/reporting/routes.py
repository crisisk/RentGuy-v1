from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.auth.deps import get_db, require_role
from .repo import ReportingRepo
from .schemas import AlertOut, MarginRow
from .usecases import ReportingService


router = APIRouter()


def _service(db: Session) -> ReportingService:
    return ReportingService(ReportingRepo(db))


@router.get("/reporting/margins", response_model=list[MarginRow])
def project_margins(db: Session = Depends(get_db), user=Depends(require_role("admin", "planner", "finance", "viewer"))):
    return _service(db).margins()


@router.get("/alerts/expiring-maintenance", response_model=list[AlertOut])
def expiring_maintenance(db: Session = Depends(get_db), user=Depends(require_role("admin", "planner", "warehouse", "viewer"))):
    return _service(db).expiring_maintenance_alerts()


@router.get("/alerts/double-bookings", response_model=list[AlertOut])
def double_bookings(db: Session = Depends(get_db), user=Depends(require_role("admin", "planner", "warehouse"))):
    return _service(db).double_booking_alerts()


@router.get("/alerts/low-stock", response_model=list[AlertOut])
def low_stock(db: Session = Depends(get_db), user=Depends(require_role("admin", "planner", "warehouse"))):
    return _service(db).low_stock_alerts()


@router.get("/alerts/summary", response_model=list[AlertOut])
def alert_summary(db: Session = Depends(get_db), user=Depends(require_role("admin", "planner", "warehouse", "finance"))):
    return _service(db).alert_summary()
