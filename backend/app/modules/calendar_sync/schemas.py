"""Pydantic schemas for the calendar synchronisation module."""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


Provider = Literal["google", "o365"]


class CalendarAccountBase(BaseModel):
    provider: Provider
    account_email: EmailStr
    active: bool = True


class CalendarAccountCreate(CalendarAccountBase):
    access_token: str | None = Field(default=None, max_length=255)
    refresh_token: str | None = Field(default=None, max_length=255)
    expires_at: datetime | None = None


class CalendarAccountUpdate(BaseModel):
    access_token: str | None = Field(default=None, max_length=255)
    refresh_token: str | None = Field(default=None, max_length=255)
    expires_at: datetime | None = None
    active: bool | None = None


class CalendarAccountOut(CalendarAccountBase):
    id: int
    user_id: int
    access_token: str | None = None
    refresh_token: str | None = None
    expires_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OAuthConnectResponse(BaseModel):
    provider: Provider
    authorization_url: str
    state: str


class TokenExchangeIn(BaseModel):
    provider: Provider
    code: str
    account_email: EmailStr
    access_token: str | None = None
    refresh_token: str | None = None
    expires_in: int | None = None


class CalendarSyncRequest(BaseModel):
    provider: Provider
    limit: int = 25


class CalendarSyncResult(BaseModel):
    provider: Provider
    processed: int
    created: int
    updated: int


class PaginatedResponse(BaseModel):
    total: int
    items: List[CalendarAccountOut]

