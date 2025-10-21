from __future__ import annotations

from typing import Callable, Mapping, Protocol

from .models import LogActionPayload


class AuditSink(Protocol):
    """Callable contract for persisting audit events."""

    def __call__(self, payload: LogActionPayload) -> None:  # pragma: no cover - protocol definition
        ...


class AuditService:
    """Service responsible for recording audit events."""

    def __init__(self, sink: AuditSink | None = None) -> None:
        self._sink: Callable[[LogActionPayload], None] = sink or (lambda payload: None)

    def log(self, payload: LogActionPayload | Mapping[str, object]) -> LogActionPayload:
        """Record an audit event and return the normalised payload."""

        if isinstance(payload, Mapping):
            payload = LogActionPayload(**payload)
        self._sink(payload)
        return payload

    def __call__(self, payload: LogActionPayload | Mapping[str, object]) -> LogActionPayload:
        return self.log(payload)
