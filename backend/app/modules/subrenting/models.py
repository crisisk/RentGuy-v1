"""SQLAlchemy models for the sub-renting module."""

from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.db import Base


class SubRentingPartner(Base):
    __tablename__ = "sr_partners"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    api_endpoint: Mapped[str] = mapped_column(String(255), nullable=False)
    api_key: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(120), nullable=False)
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    capacities: Mapped[List["PartnerCapacity"]] = relationship(
        back_populates="partner", cascade="all, delete-orphan"
    )
    availabilities: Mapped[List["PartnerAvailability"]] = relationship(
        back_populates="partner", cascade="all, delete-orphan"
    )


class PartnerCapacity(Base):
    __tablename__ = "sr_partner_capacities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    partner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sr_partners.id", ondelete="CASCADE"), nullable=False
    )
    vehicle_type: Mapped[str] = mapped_column(String(50), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price_per_unit: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_to: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    partner: Mapped[SubRentingPartner] = relationship(back_populates="capacities")


class PartnerAvailability(Base):
    __tablename__ = "sr_partner_availability"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    partner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sr_partners.id", ondelete="CASCADE"), nullable=False
    )
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="available")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    partner: Mapped[SubRentingPartner] = relationship(back_populates="availabilities")


__all__ = [
    "PartnerAvailability",
    "PartnerCapacity",
    "SubRentingPartner",
]