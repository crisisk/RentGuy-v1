"""Tests for the synchronous event bus implementation."""

from __future__ import annotations

import logging

import pytest

from app.core.events.bus import DeadLetter, EventBus


def test_publish_delivers_to_all_subscribers() -> None:
    bus = EventBus()
    received: list[int] = []

    def handler(event: dict[str, object]) -> None:
        received.append(event["payload"])  # type: ignore[index]

    bus.subscribe("test", handler)

    bus.publish({"event_type": "test", "payload": 42})

    assert received == [42]


def test_unsubscribe_removes_handler() -> None:
    bus = EventBus()
    received: list[str] = []

    def handler(event: dict[str, object]) -> None:
        received.append("called")

    bus.subscribe("sample", handler)
    bus.unsubscribe("sample", handler)

    bus.publish({"event_type": "sample"})

    assert received == []


def test_dead_letters_capture_handler_failure(caplog: pytest.LogCaptureFixture) -> None:
    bus = EventBus()

    def broken_handler(event: object) -> None:
        raise RuntimeError("boom")

    bus.subscribe("oops", broken_handler)

    caplog.set_level(logging.ERROR)
    bus.publish({"event_type": "oops", "payload": "value"})

    letters = list(bus.dead_letters())
    assert len(letters) == 1

    letter = letters[0]
    assert isinstance(letter, DeadLetter)
    assert letter.event_type == "oops"
    assert isinstance(letter.error, RuntimeError)
    assert "Event handler failed" in caplog.text

