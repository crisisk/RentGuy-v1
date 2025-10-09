"""Pydantic schemas for authentication endpoints."""

import re

from pydantic import BaseModel, field_validator


_EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


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
    role: str = "admin"


class UserLogin(_EmailBase):
    password: str


class UserOut(_EmailBase):
    id: int
    role: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
