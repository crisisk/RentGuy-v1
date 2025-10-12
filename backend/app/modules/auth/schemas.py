from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, field_validator

_EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

UserRole = Literal["pending", "planner", "crew", "warehouse", "finance", "viewer", "admin"]
SelectableRole = Literal["planner", "crew", "warehouse", "finance", "viewer", "admin"]


class _EmailBase(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if not _EMAIL_REGEX.fullmatch(value):
            raise ValueError("Invalid email format")
        return value.lower()

    model_config = {"from_attributes": True}


class UserCreate(_EmailBase):
    password: str
    role: UserRole = "pending"


class UserLogin(_EmailBase):
    password: str


class UserOut(_EmailBase):
    id: int
    role: UserRole


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRoleUpdate(BaseModel):
    role: SelectableRole
