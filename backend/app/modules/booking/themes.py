"""Theme helpers shared across the booking module."""

from __future__ import annotations

from collections.abc import Sequence
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Theme


class ThemeName(str, Enum):
    """Curated list of supported booking themes."""

    PHOTOGRAPHY = "Photography"
    VIDEOGRAPHY = "Videography"
    LIGHTING = "Lighting"
    AUDIO = "Audio"
    DRONES = "Drones"
    VR = "Virtual Reality"
    STABILIZATION = "Stabilization"
    LIVE_STREAMING = "Live Streaming"
    POWER = "Power Solutions"
    ACCESSORIES = "Accessories"


class ThemeBase(BaseModel):
    """Base payload shared by create/update operations."""

    name: ThemeName
    description: str = Field(min_length=1, max_length=255)
    icon: str = Field(default="mdi-camera", max_length=100)

    model_config = ConfigDict(use_enum_values=True)

    @field_validator("name")
    @classmethod
    def validate_theme(cls, value: ThemeName) -> ThemeName:
        if value not in ThemeName:
            raise ValueError(f"Invalid theme: {value}")
        return value


def list_themes(db: Session) -> list[Theme]:
    """Return all stored themes ordered by name."""

    return list(db.scalars(select(Theme).order_by(Theme.name)))


def get_theme_by_name(db: Session, name: str) -> Theme | None:
    """Fetch a theme by its unique name."""

    return db.scalar(select(Theme).where(Theme.name == name))


def create_theme(db: Session, payload: ThemeBase) -> Theme:
    """Persist a new theme ensuring uniqueness."""

    if get_theme_by_name(db, payload.name):
        raise ValueError("Theme name already exists")

    theme = Theme(**payload.model_dump())
    db.add(theme)
    db.flush()
    return theme


def fetch_themes(db: Session, theme_ids: Sequence[int]) -> list[Theme]:
    """Load themes for the provided identifiers, raising on unknown ids."""

    if not theme_ids:
        return []

    rows = list(db.scalars(select(Theme).where(Theme.id.in_(theme_ids))))
    missing = set(theme_ids) - {theme.id for theme in rows}
    if missing:
        raise ValueError(f"Unknown theme ids: {sorted(missing)}")
    return rows