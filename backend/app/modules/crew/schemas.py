"""Schema definitions for crew scheduling."""

from datetime import datetime
import re
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

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


class LocationUpdateIn(BaseModel):
    """Validated payload for incoming crew location updates."""

    user_id: int = Field(..., ge=1)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    project_id: int | None = Field(default=None, ge=1)
    accuracy: float | None = Field(default=None, ge=0)
    speed: float | None = Field(default=None, ge=0)
    heading: float | None = Field(default=None, ge=0, le=360)

    model_config = ConfigDict(extra="forbid")

    @field_validator("accuracy", "speed", "heading", mode="before")
    @classmethod
    def _empty_string_to_none(cls, value: object) -> object:
        if value == "":
            return None
        return value

    @field_validator("project_id", mode="before")
    @classmethod
    def _coerce_optional_int(cls, value: object) -> object:
        if value in (None, ""):
            return None
        return value


class LocationBroadcast(BaseModel):
    """Payload emitted to subscribers after a location update."""

    user_id: int
    latitude: float
    longitude: float
    timestamp: datetime
    project_id: int | None = None
    accuracy: float | None = None
    speed: float | None = None
    heading: float | None = None

    def to_socket_payload(self) -> dict[str, object]:
        payload = self.model_dump()
        payload["timestamp"] = self.timestamp.isoformat()
        return payload
