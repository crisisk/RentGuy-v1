"""Database models for managed platform secrets."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, LargeBinary, String, Text
from sqlalchemy.sql import func

from app.core.db import Base


class PlatformSecret(Base):
    """Persisted representation of an environment secret managed via the dashboard."""

    __tablename__ = "platform_secrets"

    key = Column(String(120), primary_key=True)
    label = Column(String(160), nullable=False)
    category = Column(String(64), nullable=False, default="general")
    description = Column(Text, nullable=True)
    is_sensitive = Column(Boolean, nullable=False, default=True)
    requires_restart = Column(Boolean, nullable=False, default=False)
    value_encrypted = Column(LargeBinary, nullable=True)
    value_hint = Column(String(32), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    last_synced_at = Column(DateTime(timezone=True), nullable=True)

    def mark_synced(self, moment: datetime) -> None:
        """Update bookkeeping once a value is written to disk."""

        self.last_synced_at = moment
