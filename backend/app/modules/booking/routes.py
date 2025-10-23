"""FastAPI routes for the booking and reservation module."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auth.deps import get_current_user, get_db, require_role
from app.modules.auth.models import User
from . import availability, themes
from .models import Equipment, EquipmentStatus, Payment, PaymentStatus, Reservation
from .schemas import (
    EquipmentCreate,
    EquipmentResponse,
    PaymentCreate,
    PaymentResponse,
    ReservationCreate,
    ReservationResponse,
    ThemeCreate,
    ThemeResponse,
)

router = APIRouter(prefix="/booking", tags=["booking"])


class ReservationConflictError(HTTPException):
    """Raised when a reservation collides with an existing booking."""

    def __init__(self, detail: str) -> None:
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class PaymentProcessingError(HTTPException):
    """Raised when the simulated payment processor rejects a payment."""

    def __init__(self, detail: str) -> None:
        super().__init__(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/equipment", response_model=EquipmentResponse)
def create_equipment(
    payload: EquipmentCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "planner", "warehouse")),
) -> Equipment:
    """Create a new piece of bookable equipment."""

    if db.scalar(select(Equipment).where(Equipment.name == payload.name)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Equipment name already exists",
        )

    equipment = Equipment(
        name=payload.name,
        description=payload.description,
        status=payload.status,
        hourly_rate=payload.hourly_rate,
        capacity=payload.capacity,
        attributes=payload.attributes or {},
    )

    try:
        equipment.themes = themes.fetch_themes(db, payload.theme_ids)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment


@router.get("/equipment/{equipment_id}", response_model=EquipmentResponse)
def get_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "planner", "warehouse", "viewer")),
) -> Equipment:
    """Retrieve equipment details by identifier."""

    equipment = db.get(Equipment, equipment_id)
    if equipment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Equipment not found")
    return equipment


@router.get("/themes", response_model=list[ThemeResponse])
def list_themes(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "planner", "warehouse", "viewer")),
) -> list[ThemeResponse]:
    """Return the configured set of booking themes."""

    return themes.list_themes(db)


@router.post("/reservations", response_model=ReservationResponse)
def create_reservation(
    reservation: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Reservation:
    """Create a reservation after verifying availability and ownership."""

    equipment = db.get(Equipment, reservation.equipment_id)
    if equipment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Equipment not found")

    status_value = EquipmentStatus(equipment.status)
    if status_value != EquipmentStatus.AVAILABLE:
        raise ReservationConflictError(f"Equipment {equipment.name} is {equipment.status}")

    if not availability.check_availability(
        db,
        reservation.equipment_id,
        reservation.start_time,
        reservation.end_time,
    ):
        raise ReservationConflictError("Requested time slot is not available")

    new_reservation = Reservation(
        user_id=current_user.id,
        equipment_id=reservation.equipment_id,
        start_time=reservation.start_time,
        end_time=reservation.end_time,
    )

    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)
    return new_reservation


@router.post("/payments", response_model=PaymentResponse)
def process_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Payment:
    """Process a reservation payment and persist the result."""

    reservation = db.get(Reservation, payment.reservation_id)
    if reservation is None or reservation.user_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Reservation not found")

    if reservation.payment and reservation.payment.status == PaymentStatus.COMPLETED:
        raise PaymentProcessingError("Payment already completed")

    try:
        payment_result = process_payment_gateway(
            payment.amount,
            payment.payment_method,
            payment.token,
        )
    except Exception as exc:  # pragma: no cover - defensive guard
        create_payment_record(
            db,
            reservation,
            PaymentStatus.FAILED,
            payment_method=payment.payment_method,
        )
        raise PaymentProcessingError(f"Payment failed: {exc}") from exc

    if not payment_result.success:
        create_payment_record(
            db,
            reservation,
            PaymentStatus.FAILED,
            payment_method=payment.payment_method,
        )
        raise PaymentProcessingError(payment_result.message)

    return create_payment_record(
        db,
        reservation,
        PaymentStatus.COMPLETED,
        transaction_id=payment_result.transaction_id,
        amount=payment_result.amount,
        payment_method=payment.payment_method,
    )


@dataclass
class PaymentGatewayResult:
    """Structured result returned by the mock payment gateway."""

    success: bool
    message: str
    transaction_id: str | None = None
    amount: float | None = None


def process_payment_gateway(
    amount: float | None,
    method: str,
    token: str,
) -> PaymentGatewayResult:
    """Mock payment gateway processor used during tests."""

    # In production, integrate with real payment gateway
    return PaymentGatewayResult(
        success=True,
        transaction_id="mock_123456",
        amount=amount,
        message="Payment processed successfully",
    )


def create_payment_record(
    db: Session,
    reservation: Reservation,
    status: PaymentStatus,
    *,
    transaction_id: str | None = None,
    amount: float | None = None,
    payment_method: str = "credit_card",
) -> Payment:
    """Persist a payment row for the supplied reservation."""

    if amount is None:
        duration = (reservation.end_time - reservation.start_time).total_seconds() / 3600
        db.refresh(reservation)
        equipment = reservation.equipment or db.get(Equipment, reservation.equipment_id)
        if equipment is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Equipment not found")
        amount = float(equipment.hourly_rate) * duration

    payment = Payment(
        reservation_id=reservation.id,
        amount=amount,
        status=status,
        transaction_id=transaction_id,
        payment_method=payment_method,
        processed_at=datetime.utcnow(),
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/availability/{equipment_id}")
def check_availability(
    equipment_id: int,
    start_time: datetime,
    end_time: datetime,
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """Report whether the requested time window is available for booking."""

    if start_time >= end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time",
        )

    equipment = db.get(Equipment, equipment_id)
    if equipment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Equipment not found")

    is_available = availability.check_availability(
        db,
        equipment_id,
        start_time,
        end_time,
    )
    return {
        "available": is_available,
        "equipment_id": equipment_id,
        "start_time": start_time,
        "end_time": end_time,
    }


@router.post("/themes", response_model=ThemeResponse)
def create_theme(
    theme: ThemeCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "planner")),
) -> ThemeResponse:
    """Persist a new booking theme."""

    try:
        db_theme = themes.create_theme(db, theme)
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    db.commit()
    db.refresh(db_theme)
    return db_theme


__all__ = [
    "router",
]
