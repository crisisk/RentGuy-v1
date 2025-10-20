"""FastAPI routes for the booking and reservation module."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Annotated

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
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

class PaymentProcessingError(HTTPException):
    def __init__(self, detail: str):
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
):
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
):
    equipment = db.get(Equipment, equipment_id)
    if not equipment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Equipment not found")
    return equipment


@router.get("/themes", response_model=list[ThemeResponse])
def list_themes(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "planner", "warehouse", "viewer")),
):
    return themes.list_themes(db)


@router.post("/reservations", response_model=ReservationResponse)
def create_reservation(
    reservation: ReservationCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(get_current_user),
):
    """
    Create a new equipment reservation with availability check

    Args:
        reservation: Reservation data
        db: Async database session
        current_user: Authenticated user from JWT

    Returns:
        ReservationResponse: Created reservation details

    Raises:
        ReservationConflictError: If time slot is unavailable
        HTTPException: If equipment not found or invalid data

    Test Scenarios:
        1. Reserve available time slot
        2. Attempt overlapping reservation
        3. Reserve equipment in maintenance
        4. Reserve nonexistent equipment
    """
    equipment = db.get(Equipment, reservation.equipment_id)
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )

    if equipment.status != EquipmentStatus.AVAILABLE:
        raise ReservationConflictError(
            f"Equipment {equipment.name} is {equipment.status}"
        )

    is_available = availability.check_availability(
        db,
        reservation.equipment_id,
        reservation.start_time,
        reservation.end_time
    )
    if not is_available:
        raise ReservationConflictError(
            "Requested time slot is not available"
        )

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
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(get_current_user),
):
    """
    Process payment for a reservation and update status

    Args:
        payment: Payment details
        db: Async database session
        current_user: Authenticated user

    Returns:
        PaymentResponse: Payment confirmation

    Raises:
        PaymentProcessingError: If payment fails
        HTTPException: If reservation not found

    Test Scenarios:
        1. Successful payment processing
        2. Insufficient funds
        3. Payment for already completed reservation
        4. Invalid payment method
    """
    reservation = db.get(Reservation, payment.reservation_id)
    if not reservation or reservation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )

    if reservation.payment and reservation.payment.status == PaymentStatus.COMPLETED:
        raise PaymentProcessingError("Payment already completed")

    try:
        payment_result = process_payment_gateway(
            payment.amount,
            payment.payment_method,
            payment.token
        )
    except Exception as e:
        create_payment_record(
            db,
            reservation,
            PaymentStatus.FAILED,
            payment_method=payment.payment_method,
        )
        raise PaymentProcessingError(f"Payment failed: {str(e)}") from e

    if not payment_result.success:
        create_payment_record(
            db,
            reservation,
            PaymentStatus.FAILED,
            payment_method=payment.payment_method,
        )
        raise PaymentProcessingError(payment_result.message)

    db_payment = create_payment_record(
        db,
        reservation,
        PaymentStatus.COMPLETED,
        payment_result.transaction_id,
        payment_result.amount,
        payment.payment_method,
    )
    return db_payment

@dataclass
class PaymentGatewayResult:
    success: bool
    message: str
    transaction_id: str | None = None
    amount: float | None = None


def process_payment_gateway(
    amount: float | None,
    method: str,
    token: str
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
    transaction_id: str | None = None,
    amount: float | None = None,
    payment_method: str = "credit_card",
) -> Payment:
    """
    Create payment record in database

    Args:
        db: Database session
        reservation: Related reservation
        status: Payment status
        transaction_id: Gateway transaction ID
        amount: Paid amount

    Returns:
        Payment: Created payment record
    """
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
        processed_at=datetime.utcnow()
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
    db: Annotated[Session, Depends(get_db)],
):
    """
    Check equipment availability for given time range

    Args:
        equipment_id: Target equipment ID
        start_time: Check start time (UTC)
        end_time: Check end time (UTC)

    Returns:
        dict: Availability status

    Raises:
        HTTPException: If invalid time range

    Test Scenarios:
        1. Available time slot
        2. Conflicting reservation exists
        3. Equipment in maintenance
    """
    if start_time >= end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time"
        )
    
    equipment = db.get(Equipment, equipment_id)
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )

    is_available = availability.check_availability(
        db,
        equipment_id,
        start_time,
        end_time
    )
    return {
        "available": is_available,
        "equipment_id": equipment_id,
        "start_time": start_time,
        "end_time": end_time
    }

@router.post("/themes", response_model=ThemeResponse)
def create_theme(
    theme: ThemeCreate,
    db: Annotated[Session, Depends(get_db)],
    _user: User = Depends(require_role("admin")),
):
    """
    Create new equipment theme (Admin-only)

    Args:
        theme: Theme data
        db: Database session
        current_user: Authenticated user

    Returns:
        ThemeCreate: Created theme

    Raises:
        HTTPException: If unauthorized or duplicate name

    Test Scenarios:
        1. Admin creates valid theme
        2. Non-admin attempts creation
        3. Duplicate theme name
    """
    try:
        db_theme = themes.create_theme(db, theme)
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    db.commit()
    db.refresh(db_theme)
    return db_theme