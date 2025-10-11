"""Schema definitions for crew scheduling."""

from datetime import datetime
import re
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

_EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class CrewMemberIn(BaseModel):
    name: str
    role: str = "crew"
    phone: Optional[str] = None
    email: Optional[str] = None
    active: bool = True

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if not _EMAIL_REGEX.fullmatch(value):
            raise ValueError("Invalid email format")
        return value.lower()


class CrewMemberOut(BaseModel):
    id: int
    name: str
    role: str
    phone: Optional[str] = None
    email: Optional[str] = None
    active: bool

    model_config = ConfigDict(from_attributes=True)


class BookingIn(BaseModel):
    project_id: int
    crew_id: int
    start: datetime
    end: datetime
    role: str = "crew"


class BookingOut(BaseModel):
    id: int
    project_id: int
    crew_id: int
    start: datetime
    end: datetime
    role: str
    status: str

    model_config = ConfigDict(from_attributes=True)
