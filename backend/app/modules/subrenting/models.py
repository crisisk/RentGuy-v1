"""SQLAlchemy models for the sub-renting module."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class SubRentingPartner(Base):
    """Represents an external partner that offers rental capacity."""

    __tablename__ = "subrenting_partners"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    api_endpoint: Mapped[str] = mapped_column(String(200), nullable=False)
    api_key: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    capacities: Mapped[list["PartnerCapacity"]] = relationship(
        back_populates="partner", cascade="all, delete-orphan"
    )
    availabilities: Mapped[list["PartnerAvailability"]] = relationship(
        back_populates="partner", cascade="all, delete-orphan"
    )


class PartnerCapacity(Base):
    """Represents the available capacity exposed by a partner."""

    __tablename__ = "partner_capacities"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    partner_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("subrenting_partners.id", ondelete="CASCADE"), nullable=False
    )
    vehicle_type: Mapped[str] = mapped_column(String(50), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price_per_unit: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_to: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    partner: Mapped[SubRentingPartner] = relationship(back_populates="capacities")


class PartnerAvailability(Base):
    """Represents availability slots provided by a partner."""

    __tablename__ = "partner_availabilities"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    partner_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("subrenting_partners.id", ondelete="CASCADE"), nullable=False
    )
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="available", server_default="available")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    partner: Mapped[SubRentingPartner] = relationship(back_populates="availabilities")


__all__ = ["SubRentingPartner", "PartnerCapacity", "PartnerAvailability"]
