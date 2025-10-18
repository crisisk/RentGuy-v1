"""
SQLAlchemy models for sub-renting module
Includes partner networks, capacity sharing and availability tracking
"""
from sqlalchemy import Column, ForeignKey, String, DateTime, Numeric, Integer, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from datetime import datetime
from typing import Optional

from app.database import Base

class SubRentingPartner(Base):
    __tablename__ = "subrenting_partners"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name = Column(String(100), nullable=False, index=True)
    api_endpoint = Column(String(200), nullable=False)
    api_key = Column(String(200), nullable=False)
    contact_email = Column(String(100), nullable=False)
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    capacities: Mapped[list["PartnerCapacity"]] = relationship(back_populates="partner")
    availabilities: Mapped[list["PartnerAvailability"]] = relationship(back_populates="partner")

class PartnerCapacity(Base):
    __tablename__ = "partner_capacities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    partner_id = Column(UUID(as_uuid=True), ForeignKey("subrenting_partners.id", ondelete="CASCADE"), nullable=False)
    vehicle_type = Column(String(50), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_per_unit = Column(Numeric(10,2), nullable=False)
    currency = Column(String(3), nullable=False)
    valid_from = Column(DateTime(timezone=True), nullable=False)
    valid_to = Column(DateTime(timezone=True), nullable=False)
    
    partner: Mapped["SubRentingPartner"] = relationship(back_populates="capacities")

class PartnerAvailability(Base):
    __tablename__ = "partner_availabilities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    partner_id = Column(UUID(as_uuid=True), ForeignKey("subrenting_partners.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), nullable=False, default="available")  # available, reserved
    
    partner: Mapped["SubRentingPartner"] = relationship(back_populates="availabilities")