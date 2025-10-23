"""Pydantic schemas for the sub-renting module."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class PartnerBase(BaseModel):
    name: str = Field(..., max_length=100)
    api_endpoint: str = Field(..., max_length=255)
    contact_email: str = Field(..., max_length=120)
    location: str = Field(..., description="WKT format POINT(lon lat)")

    @field_validator("location")
    @classmethod
    def validate_location(cls, value: str) -> str:
        if not value.startswith("POINT"):
            raise ValueError("Invalid location format. Expected WKT POINT string")
        return value


class PartnerCreate(PartnerBase):
    api_key: str = Field(..., max_length=255)


class PartnerResponse(PartnerBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CapacityBase(BaseModel):
    vehicle_type: str = Field(..., max_length=50)
    quantity: int = Field(..., gt=0)
    price_per_unit: float = Field(..., gt=0)
    currency: str = Field(..., min_length=3, max_length=3)
    valid_from: datetime
    valid_to: datetime

    @model_validator(mode="after")
    def _validate_dates(self) -> "CapacityBase":
        if self.valid_from >= self.valid_to:
            raise ValueError("valid_from must be before valid_to")
        return self


class CapacityCreate(CapacityBase):
    pass


class CapacityResponse(CapacityBase):
    id: UUID
    partner_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AvailabilityBase(BaseModel):
    start_time: datetime
    end_time: datetime
    status: str = Field("available", max_length=20)

    @field_validator("status")
    @classmethod
    def _validate_status(cls, value: str) -> str:
        if value not in {"available", "reserved"}:
            raise ValueError("Invalid status value")
        return value

    @model_validator(mode="after")
    def _validate_end_time(self) -> "AvailabilityBase":
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class AvailabilityCreate(AvailabilityBase):
    pass


class AvailabilityResponse(AvailabilityBase):
    id: UUID
    partner_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


__all__ = [
    "PartnerCreate",
    "PartnerResponse",
    "CapacityCreate",
    "CapacityResponse",
    "AvailabilityCreate",
    "AvailabilityResponse",
]
