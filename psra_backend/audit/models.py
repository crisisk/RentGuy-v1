from __future__ import annotations

from dataclasses import dataclass, field, replace
from datetime import datetime, timezone
from typing import Any, Mapping


@dataclass(slots=True)
class LogActionPayload:
    """Structured payload describing an audit log entry."""

    action: str
    actor: str | None = None
    metadata: Mapping[str, Any] | None = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def with_metadata(self, **extra: Any) -> "LogActionPayload":
        """Return a copy of the payload with merged metadata."""

        base = dict(self.metadata or {})
        base.update(extra)
        return replace(self, metadata=base)
