from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock

import pytest
from sqlalchemy.orm import sessionmaker

from app.modules.crew import sockets as crew_sockets
from app.modules.crew.models import Location


@pytest.fixture()
def crew_session_factory(db_session, monkeypatch):
    """Patch the crew socket session factory to use the in-memory test database."""

    testing_session_local = sessionmaker(bind=db_session.bind, autocommit=False, autoflush=False)
    monkeypatch.setattr(crew_sockets, "SessionLocal", testing_session_local)
    yield testing_session_local


@pytest.fixture()
def crew_server():
    server = AsyncMock()
    server.emit = AsyncMock()
    server.enter_room = AsyncMock()
    server.leave_room = AsyncMock()
    crew_sockets.register_socket_server(server)
    return server


def test_join_project_enters_room_and_confirms(crew_server, crew_session_factory):
    asyncio.run(crew_sockets.join_project("sid-1", {"project_id": 42}))

    crew_server.enter_room.assert_awaited_once_with("sid-1", "project_42")
    crew_server.emit.assert_awaited_once_with(
        "status", {"message": "Joined project 42"}, room="sid-1"
    )


def test_join_project_rejects_invalid_payload(crew_server, crew_session_factory):
    asyncio.run(crew_sockets.join_project("sid-1", {"project_id": ""}))

    crew_server.enter_room.assert_not_called()
    error_call = crew_server.emit.await_args_list[0]
    assert error_call.args[0] == "error"
    assert error_call.kwargs["room"] == "sid-1"


def test_leave_project_leaves_room_and_confirms(crew_server, crew_session_factory):
    asyncio.run(crew_sockets.leave_project("sid-1", {"project_id": 42}))

    crew_server.leave_room.assert_awaited_once_with("sid-1", "project_42")
    crew_server.emit.assert_awaited_once_with(
        "status", {"message": "Left project 42"}, room="sid-1"
    )


def test_update_location_persists_and_broadcasts(crew_server, crew_session_factory):
    asyncio.run(
        crew_sockets.update_location(
            "sid-2",
            {
                "user_id": 7,
                "latitude": 52.37,
                "longitude": 4.89,
                "project_id": 10,
                "accuracy": 5.5,
                "speed": 1.2,
                "heading": 180,
            },
        )
    )

    with crew_session_factory() as session:
        stored = session.query(Location).one()
        assert stored.user_id == 7
        assert stored.project_id == 10
        assert stored.accuracy == 5.5
        assert stored.geom == "POINT(4.89 52.37)"

    rooms = {call.kwargs["room"] for call in crew_server.emit.await_args_list if call.args[0] == "location_update"}
    assert rooms == {"project_10", "managers"}
