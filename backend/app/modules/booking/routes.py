"""
FastAPI routes for equipment reservation system
"""
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field, root_validator, validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.authStore import get_current_user
from . import availability, themes
from .models import (
    Equipment,
    EquipmentStatus,
    PaymentStatus,
    Reservation,
    Payment,
    Theme,
)
from .schemas import (
    EquipmentCreate,
    EquipmentResponse,
    ReservationCreate,
    ReservationResponse,
    PaymentCreate,
    PaymentResponse,
    ThemeCreate,
)

router = APIRouter(prefix="/booking", tags=["booking"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

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

@router.post("/reservations", response_model=ReservationResponse)
async def create_reservation(
    reservation: ReservationCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: dict = Depends(get_current_user),
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
    equipment = await db.get(Equipment, reservation.equipment_id)
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    if equipment.status != EquipmentStatus.AVAILABLE:
        raise ReservationConflictError(
            f"Equipment {equipment.name} is {equipment.status}"
        )

    is_available = await availability.check_availability(
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
        user_id=current_user["id"],
        equipment_id=reservation.equipment_id,
        start_time=reservation.start_time,
        end_time=reservation.end_time,
    )

    db.add(new_reservation)
    await db.commit()
    await db.refresh(new_reservation)
    return new_reservation

@router.post("/payments", response_model=PaymentResponse)
async def process_payment(
    payment: PaymentCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: dict = Depends(get_current_user),
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
    reservation = await db.get(Reservation, payment.reservation_id)
    if not reservation or reservation.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    
    if reservation.payment and reservation.payment.status == PaymentStatus.COMPLETED:
        raise PaymentProcessingError("Payment already completed")

    try:
        payment_result = await process_payment_gateway(
            payment.amount,
            payment.payment_method,
            payment.token
        )
    except Exception as e:
        await create_payment_record(db, reservation, PaymentStatus.FAILED)
        raise PaymentProcessingError(f"Payment failed: {str(e)}") from e

    if not payment_result.success:
        await create_payment_record(db, reservation, PaymentStatus.FAILED)
        raise PaymentProcessingError(payment_result.message)
    
    db_payment = await create_payment_record(
        db,
        reservation,
        PaymentStatus.COMPLETED,
        payment_result.transaction_id,
        payment_result.amount
    )
    return db_payment

async def process_payment_gateway(
    amount: float,
    method: str,
    token: str
) -> dict:
    """
    Mock payment gateway processor

    Args:
        amount: Payment amount
        method: Payment method (e.g., 'credit_card')
        token: Payment token from client

    Returns:
        dict: Processing result

    Test Scenarios:
        1. Successful transaction
        2. Declined transaction
        3. Network error
    """
    # In production, integrate with real payment gateway
    return {
        "success": True,
        "transaction_id": "mock_123456",
        "amount": amount,
        "message": "Payment processed successfully"
    }

async def create_payment_record(
    db: AsyncSession,
    reservation: Reservation,
    status: PaymentStatus,
    transaction_id: str = None,
    amount: float = None
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
    if not amount:
        duration = (reservation.end_time - reservation.start_time).total_seconds() / 3600
        amount = reservation.equipment.hourly_rate * duration

    payment = Payment(
        reservation_id=reservation.id,
        amount=amount,
        status=status,
        transaction_id=transaction_id,
        payment_method="credit_card",
        processed_at=datetime.utcnow()
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment

@router.get("/availability/{equipment_id}")
async def check_availability(
    equipment_id: int,
    start_time: datetime,
    end_time: datetime,
    db: Annotated[AsyncSession, Depends(get_db)]
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
    
    equipment = await db.get(Equipment, equipment_id)
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    is_available = await availability.check_availability(
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

@router.post("/themes", response_model=ThemeCreate)
async def create_theme(
    theme: ThemeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: dict = Depends(get_current_user),
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
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    existing = await db.execute(
        select(Theme).where(Theme.name == theme.name)
    )
    if existing.scalar():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Theme name already exists"
        )
    
    db_theme = Theme(**theme.dict())
    db.add(db_theme)
    await db.commit()
    await db.refresh(db_theme)
    return db_theme