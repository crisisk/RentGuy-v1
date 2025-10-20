"""Database models for the booking module."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    UniqueConstraint,
    false,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


equipment_theme_association = Table(
    "booking_equipment_themes",
    Base.metadata,
    Column("equipment_id", ForeignKey("booking_equipment.id"), primary_key=True),
    Column("theme_id", ForeignKey("booking_themes.id"), primary_key=True),
)


class EquipmentStatus(str, Enum):
    """Possible lifecycle states for bookable equipment."""

    AVAILABLE = "available"
    MAINTENANCE = "maintenance"
    RESERVED = "reserved"


class PaymentStatus(str, Enum):
    """Payment processing result states."""

    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Theme(Base):
    """Visual themes for the online booking flow."""

    __tablename__ = "booking_themes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[str] = mapped_column(String(100), default="mdi-camera", nullable=False)
    equipment: Mapped[List["Equipment"]] = relationship(
        "app.modules.booking.models.Equipment",
        secondary=equipment_theme_association,
        back_populates="themes",
        lazy="selectin",
    )


class Equipment(Base):
    """Inventory items that can be reserved through the booking module."""

    __tablename__ = "booking_equipment"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[EquipmentStatus] = mapped_column(
        String(20),
        default=EquipmentStatus.AVAILABLE.value,
        server_default=EquipmentStatus.AVAILABLE.value,
    )
    hourly_rate: Mapped[float] = mapped_column(Numeric(10, 2))
    capacity: Mapped[int] = mapped_column(Integer)
    attributes: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    themes: Mapped[List[Theme]] = relationship(
        "app.modules.booking.models.Theme",
        secondary=equipment_theme_association,
        back_populates="equipment",
        lazy="selectin",
    )
    reservations: Mapped[List["Reservation"]] = relationship(
        "app.modules.booking.models.Reservation",
        back_populates="equipment",
        cascade="all,delete-orphan",
    )

    __table_args__ = (UniqueConstraint("name", name="uq_booking_equipment_name"),)


class Reservation(Base):
    """Customer reservations for equipment."""

    __tablename__ = "booking_reservations"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("auth_users.id", ondelete="CASCADE"),
        index=True,
    )
    equipment_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("booking_equipment.id", ondelete="RESTRICT"),
        index=True,
    )
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, server_default="CURRENT_TIMESTAMP"
    )
    cancelled: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    payment: Mapped[Optional["Payment"]] = relationship(
        "app.modules.booking.models.Payment",
        back_populates="reservation",
        uselist=False,
    )
    equipment: Mapped[Equipment] = relationship(
        "app.modules.booking.models.Equipment",
        back_populates="reservations",
    )

    __table_args__ = (
        Index("ix_booking_reservation_time", "equipment_id", "start_time", "end_time"),
    )


class Payment(Base):
    """Payment captured for a reservation."""

    __tablename__ = "booking_payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    reservation_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("booking_reservations.id", ondelete="CASCADE"),
        unique=True,
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    status: Mapped[PaymentStatus] = mapped_column(
        String(20),
        default=PaymentStatus.PENDING.value,
        server_default=PaymentStatus.PENDING.value,
    )
    transaction_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payment_method: Mapped[str] = mapped_column(String(50))
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reservation: Mapped[Reservation] = relationship(
        "app.modules.booking.models.Reservation",
        back_populates="payment",
    )


__all__ = [
    "Equipment",
    "EquipmentStatus",
    "Payment",
    "PaymentStatus",
    "Reservation",
    "Theme",
    "equipment_theme_association",
]