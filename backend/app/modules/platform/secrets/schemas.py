"""Pydantic schemas for the secrets dashboard API."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, SecretStr


class SecretOut(BaseModel):
    key: str
    label: str
    category: str
    description: str | None = None
    is_sensitive: bool = Field(default=True, description="Whether the value should be masked in the UI.")
    requires_restart: bool = Field(
        default=False,
        description="Indicates if updating the value requires a service restart to take effect.",
    )
    has_value: bool = Field(default=False, description="True when an encrypted value is present.")
    value_hint: str | None = Field(default=None, description="Redacted preview to help operators identify the value.")
    updated_at: datetime | None = None
    last_synced_at: datetime | None = None


class SecretUpdateRequest(BaseModel):
    value: SecretStr | None = Field(default=None, description="New value for the secret; blank values clear the secret.")


class SecretSyncResponse(BaseModel):
    applied: int
    env_path: str
    triggered_restart: bool
    timestamp: datetime


class EmailDiagnosticsResponse(BaseModel):
    status: Literal["ok", "warning", "error"]
    message: str
    missing: list[str] = Field(default_factory=list)
    configured: list[str] = Field(default_factory=list)
    node_ready: bool = Field(
        default=False,
        description="True when the SMTP configuration is compatible with Node.js/Express mailers.",
    )
    auth_configured: bool = Field(
        default=False,
        description="True when SMTP authentication credentials have been supplied.",
    )
