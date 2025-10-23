"""Pydantic schemas for the booking module."""

from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator

from .models import EquipmentStatus, PaymentStatus
from .themes import ThemeBase


class ThemeResponse(BaseModel):
    """Serialized representation of a booking theme."""

    id: int
    name: str
    description: Optional[str]
    icon: str

    model_config = ConfigDict(from_attributes=True)


class EquipmentCreate(BaseModel):
    """Payload used to create new equipment."""

    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1)
    hourly_rate: float = Field(gt=0)
    capacity: int = Field(ge=1)
    status: EquipmentStatus = EquipmentStatus.AVAILABLE
    attributes: dict[str, Any] | None = None
    theme_ids: List[int] = Field(default_factory=list)


class EquipmentResponse(BaseModel):
    """Equipment serialized for API responses."""

    id: int
    name: str
    description: str
    status: EquipmentStatus
    hourly_rate: float
    capacity: int
    attributes: dict[str, Any] | None = None
    themes: List[ThemeResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ReservationCreate(BaseModel):
    """Payload required to reserve equipment."""

    equipment_id: int
    start_time: datetime
    end_time: datetime

    @field_validator("end_time")
    @classmethod
    def ensure_valid_range(cls, end_time: datetime, info: ValidationInfo) -> datetime:
        start_time = info.data.get("start_time") if info.data else None
        if start_time and end_time <= start_time:
            raise ValueError("end_time must be after start_time")
        return end_time


class ReservationResponse(BaseModel):
    """Reservation returned after creation."""

    id: int
    user_id: int
    equipment_id: int
    start_time: datetime
    end_time: datetime
    cancelled: bool

    model_config = ConfigDict(from_attributes=True)


class PaymentCreate(BaseModel):
    """Information required to process a payment."""

    reservation_id: int
    amount: Optional[float] = Field(default=None, gt=0)
    payment_method: str = Field(min_length=1)
    token: str = Field(min_length=1)


class PaymentResponse(BaseModel):
    """Serialized payment."""

    id: int
    reservation_id: int
    amount: float
    status: PaymentStatus
    transaction_id: Optional[str]
    payment_method: str
    processed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class ThemeCreate(ThemeBase):
    """Expose theme creation payload with ThemeBase validation."""

    pass
