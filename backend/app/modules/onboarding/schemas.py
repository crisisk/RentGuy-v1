"""Pydantic schemas for onboarding workflow."""

from datetime import datetime
import re
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

_EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class StepOut(BaseModel):
    code: str
    title: str
    description: str

    model_config = ConfigDict(from_attributes=True)


class _EmailPayload(BaseModel):
    user_email: str

    @field_validator("user_email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if not _EMAIL_REGEX.fullmatch(value):
            raise ValueError("Invalid email format")
        return value.lower()


class ProgressOut(_EmailPayload):
    step_code: str
    status: str
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CompleteIn(_EmailPayload):
    step_code: str


class TipOut(BaseModel):
    id: int
    module: str
    message: str
    cta: str

    model_config = ConfigDict(from_attributes=True)
