from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock

import pytest
from sqlalchemy.orm import sessionmaker

from app.modules.chat import sockets as chat_sockets
from app.modules.chat.models import Message


@pytest.fixture()
def chat_session_factory(db_session, monkeypatch):
    testing_session_local = sessionmaker(bind=db_session.bind, autocommit=False, autoflush=False)
    monkeypatch.setattr(chat_sockets, "SessionLocal", testing_session_local)
    yield testing_session_local


@pytest.fixture()
def chat_server():
    server = AsyncMock()
    server.emit = AsyncMock()
    chat_sockets.register_socket_server(server)
    return server


def test_send_message_persists_and_broadcasts(chat_server, chat_session_factory):
    asyncio.run(
        chat_sockets.send_message(
            "sid-3",
            {
                "project_id": 5,
                "user_id": 9,
                "content": "Hoi team",
            },
        )
    )

    with chat_session_factory() as session:
        stored = session.query(Message).one()
        assert stored.project_id == 5
        assert stored.user_id == 9
        assert stored.content == "Hoi team"

    chat_server.emit.assert_awaited_once()
    call = chat_server.emit.await_args_list[0]
    assert call.args[0] == "new_message"
    assert call.kwargs["room"] == "project_5"
    assert call.args[1]["content"] == "Hoi team"


def test_send_message_rejects_invalid_payload(chat_server, chat_session_factory):
    asyncio.run(
        chat_sockets.send_message(
            "sid-3",
            {
                "project_id": 5,
                "content": "",
            },
        )
    )

    with chat_session_factory() as session:
        assert session.query(Message).count() == 0

    error_call = chat_server.emit.await_args_list[0]
    assert error_call.args[0] == "error"
    assert error_call.kwargs["room"] == "sid-3"
    assert error_call.args[1]["message"] == "Invalid message payload"
