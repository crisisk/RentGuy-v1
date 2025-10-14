"""
Pydantic schemas for sub-renting module
Includes validation for partner data, capacity and availability
"""
from pydantic import BaseModel, Field, validator, root_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class PartnerBase(BaseModel):
    name: str = Field(..., max_length=100)
    api_endpoint: str = Field(..., max_length=200)
    contact_email: str = Field(..., max_length=100)
    location: str = Field(..., description="WKT format POINT(lon lat)")
    
    @validator('location')
    def validate_location(cls, v):
        if not v.startswith("POINT"):
            raise ValueError("Invalid location format. Must be WKT POINT")
        return v

class PartnerCreate(PartnerBase):
    api_key: str = Field(..., max_length=200)

class PartnerUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    api_endpoint: Optional[str] = Field(None, max_length=200)
    contact_email: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, description="WKT format POINT(lon lat)")

class PartnerResponse(PartnerBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        orm_mode = True

class CapacityBase(BaseModel):
    vehicle_type: str = Field(..., max_length=50)
    quantity: int = Field(..., gt=0)
    price_per_unit: float = Field(..., gt=0)
    currency: str = Field(..., min_length=3, max_length=3)
    valid_from: datetime
    valid_to: datetime
    
    @root_validator
    def validate_dates(cls, values):
        if values['valid_from'] >= values['valid_to']:
            raise ValueError("valid_from must be before valid_to")
        return values

class CapacityCreate(CapacityBase):
    pass

class CapacityResponse(CapacityBase):
    id: UUID
    partner_id: UUID
    created_at: datetime
    
    class Config:
        orm_mode = True

class AvailabilityBase(BaseModel):
    start_time: datetime
    end_time: datetime
    status: str = Field("available", max_length=20)
    
    @validator('status')
    def validate_status(cls, v):
        if v not in {'available', 'reserved'}:
            raise ValueError("Invalid status value")
        return v
    
    @validator('end_time')
    def validate_end_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError("end_time must be after start_time")
        return v

class AvailabilityCreate(AvailabilityBase):
    pass

class AvailabilityResponse(AvailabilityBase):
    id: UUID
    partner_id: UUID
    created_at: datetime
    
    class Config:
        orm_mode = True