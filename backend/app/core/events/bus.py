"""Simple in-memory event bus used by the API services."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Callable, Dict, Iterable, List, MutableMapping

logger = logging.getLogger(__name__)

Handler = Callable[[Any], None]


@dataclass(frozen=True)
class DeadLetter:
    """Represents a failed event delivery attempt."""

    event_type: str
    event: Any
    error: Exception


def _resolve_event_type(event: Any) -> str:
    """Return the event type string for the given event."""

    if isinstance(event, str):
        return event
    if isinstance(event, dict):
        candidate = event.get("event_type")
        if isinstance(candidate, str):
            return candidate
    return getattr(event, "event_type", "")


class EventBus:
    """Lightweight synchronous event bus with dead-letter tracking."""

    def __init__(self) -> None:
        self._subs: MutableMapping[str, List[Handler]] = {}
        self._dead_letters: List[DeadLetter] = []

    # ---------------------------------------------------------------------
    # Subscription management
    def subscribe(self, event_type: str, handler: Handler) -> None:
        """Register a handler for a specific event type."""

        self._subs.setdefault(event_type, []).append(handler)

    def unsubscribe(self, event_type: str, handler: Handler) -> None:
        """Remove a handler for the provided event type if present."""

        handlers = self._subs.get(event_type)
        if not handlers:
            return
        try:
            handlers.remove(handler)
        except ValueError:  # pragma: no cover - defensive guard
            return
        if not handlers:
            self._subs.pop(event_type, None)

    def clear_dead_letters(self) -> None:
        """Drop all stored dead letters."""

        self._dead_letters.clear()

    def dead_letters(self) -> Iterable[DeadLetter]:
        """Expose the collected dead letters."""

        return tuple(self._dead_letters)

    # ------------------------------------------------------------------
    # Publishing
    def publish(self, event: Any) -> None:
        """Publish an event to all subscribed handlers."""

        event_type = _resolve_event_type(event)
        for handler in list(self._subs.get(event_type, [])):
            try:
                handler(event)
            except Exception as exc:  # pragma: no cover - defensive logging
                logger.exception(
                    "Event handler failed",
                    extra={
                        "event_type": event_type,
                        "handler": getattr(handler, "__qualname__", repr(handler)),
                    },
                )
                self._dead_letters.append(DeadLetter(event_type, event, exc))


bus = EventBus()

__all__ = ["EventBus", "DeadLetter", "bus"]
