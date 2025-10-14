"""
Pydantic schemas for Customer Portal module
"""
from datetime import datetime
from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, List
import re

class UserProfileBase(BaseModel):
    company_name: Optional[str] = Field(max_length=100)
    phone: Optional[str] = Field(max_length=20)
    address: Optional[str] = Field(max_length=200)
    city: Optional[str] = Field(max_length=50)
    state: Optional[str] = Field(max_length=50)
    country: Optional[str] = Field(max_length=50)
    postal_code: Optional[str] = Field(max_length=20)

    @validator('phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^\+?[1-9]\d{1,14}$', v):
            raise ValueError('Invalid phone number format')
        return v

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class InvoiceResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    due_date: datetime
    status: str
    invoice_number: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    user_id: int
    order_number: str
    product_name: str
    quantity: int
    total_price: float
    status: str
    order_date: datetime

    class Config:
        from_attributes = True

class DocumentCreate(BaseModel):
    name: str = Field(max_length=100)
    is_public: bool = False
    expires_at: Optional[datetime]

class DocumentResponse(BaseModel):
    id: int
    user_id: int
    name: str
    file_path: str
    is_public: bool
    uploaded_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True

class PaginatedResponse(BaseModel):
    total: int
    items: List