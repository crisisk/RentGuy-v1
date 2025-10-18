"""
SQLAlchemy models for equipment reservation system
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, declarative_base, mapped_column, relationship

Base = declarative_base()

equipment_theme_association = Table(
    "equipment_theme_association",
    Base.metadata,
    Column("equipment_id", Integer, ForeignKey("equipment.id")),
    Column("theme_id", Integer, ForeignKey("theme.id")),
)

class EquipmentStatus(str, Enum):
    AVAILABLE = "available"
    MAINTENANCE = "maintenance"
    RESERVED = "reserved"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class Theme(Base):
    __tablename__ = "theme"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(String(100))
    equipment: Mapped[List["Equipment"]] = relationship(
        secondary=equipment_theme_association, back_populates="themes"
    )

class Equipment(Base):
    __tablename__ = "equipment"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[EquipmentStatus] = mapped_column(String(20), default=EquipmentStatus.AVAILABLE)
    hourly_rate: Mapped[float] = mapped_column(Numeric(10, 2))
    capacity: Mapped[int] = mapped_column(Integer)
    metadata: Mapped[dict] = mapped_column(JSON, default={})
    themes: Mapped[List[Theme]] = relationship(
        secondary=equipment_theme_association, back_populates="equipment"
    )
    reservations: Mapped[List["Reservation"]] = relationship(back_populates="equipment")

    __table_args__ = (
        UniqueConstraint("name", name="uq_equipment_name"),
    )

class Reservation(Base):
    __tablename__ = "reservation"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), index=True)
    equipment_id: Mapped[int] = mapped_column(Integer, ForeignKey("equipment.id"), index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    cancelled: Mapped[bool] = mapped_column(Boolean, default=False)
    payment: Mapped["Payment"] = relationship(back_populates="reservation", uselist=False)
    equipment: Mapped[Equipment] = relationship(back_populates="reservations")

    __table_args__ = (
        Index("ix_reservation_time_range", "equipment_id", "start_time", "end_time"),
    )

class Payment(Base):
    __tablename__ = "payment"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reservation_id: Mapped[int] = mapped_column(Integer, ForeignKey("reservation.id"), unique=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    status: Mapped[PaymentStatus] = mapped_column(String(20), default=PaymentStatus.PENDING)
    transaction_id: Mapped[Optional[str]] = mapped_column(String(100))
    payment_method: Mapped[str] = mapped_column(String(50))
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    reservation: Mapped[Reservation] = relationship(back_populates="payment")