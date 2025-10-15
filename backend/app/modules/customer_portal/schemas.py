"""Pydantic models for the customer portal APIs."""

from __future__ import annotations

from datetime import datetime
from typing import Generic, List, Optional, TypeVar
import re

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.generics import GenericModel

T = TypeVar("T")


class UserProfileBase(BaseModel):
    company_name: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = Field(default=None, max_length=200)
    city: Optional[str] = Field(default=None, max_length=50)
    state: Optional[str] = Field(default=None, max_length=50)
    country: Optional[str] = Field(default=None, max_length=50)
    postal_code: Optional[str] = Field(default=None, max_length=20)

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, value: str | None) -> str | None:
        if value and not re.fullmatch(r"\+?[0-9]{6,20}", value):
            raise ValueError("Invalid phone number format")
        return value


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileResponse(UserProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class InvoiceResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    due_date: datetime
    status: str
    invoice_number: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    user_id: int
    order_number: str
    product_name: str
    quantity: int
    total_price: float
    status: str
    order_date: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentCreate(BaseModel):
    name: str = Field(max_length=100)
    file_path: str = Field(max_length=200)
    is_public: bool = False
    expires_at: Optional[datetime] = None


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    name: str
    file_path: str
    is_public: bool
    uploaded_at: datetime
    expires_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(GenericModel, Generic[T]):
    total: int
    items: List[T]


class PaginatedInvoicesResponse(PaginatedResponse[InvoiceResponse]):
    pass


class PaginatedOrdersResponse(PaginatedResponse[OrderResponse]):
    pass


class PaginatedDocumentsResponse(PaginatedResponse[DocumentResponse]):
    pass


__all__ = [
    "UserProfileCreate",
    "UserProfileResponse",
    "InvoiceResponse",
    "OrderResponse",
    "DocumentCreate",
    "DocumentResponse",
    "PaginatedInvoicesResponse",
    "PaginatedOrdersResponse",
    "PaginatedDocumentsResponse",
]
