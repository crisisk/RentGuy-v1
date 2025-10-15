"""Socket.IO event handlers for the chat module."""

from __future__ import annotations

import logging
from typing import Optional

from pydantic import ValidationError
from socketio import AsyncServer
from sqlalchemy.exc import SQLAlchemyError

from app.core.db import SessionLocal
from app.modules.chat.repo import ChatRepo
from app.modules.chat.schemas import MessageIn, MessageOut

logger = logging.getLogger(__name__)

_sio: Optional[AsyncServer] = None


def register_socket_server(server: AsyncServer) -> None:
    global _sio
    _sio = server


def _require_server() -> AsyncServer:
    if _sio is None:  # pragma: no cover - defensive guard
        raise RuntimeError("Socket server has not been initialised")
    return _sio


async def send_message(sid: str, data: dict) -> None:
    """Persist an incoming message and broadcast it to the project room."""

    sio = _require_server()

    try:
        payload = MessageIn.model_validate(data)
    except ValidationError as exc:
        logger.warning(
            "Invalid chat message payload",
            extra={"sid": sid, "errors": exc.errors(), "payload": data},
        )
        await sio.emit(
            "error",
            {"message": "Invalid message payload", "details": exc.errors()},
            room=sid,
        )
        return

    with SessionLocal() as db:
        repo = ChatRepo(db)
        try:
            message_model = repo.create_message(
                project_id=payload.project_id,
                user_id=payload.user_id,
                content=payload.content,
            )
        except SQLAlchemyError:
            db.rollback()
            logger.exception(
                "Failed to persist chat message",
                extra={"sid": sid, "project_id": payload.project_id, "user_id": payload.user_id},
            )
            await sio.emit(
                "error",
                {"message": "Failed to persist message"},
                room=sid,
            )
            return

    message_out = MessageOut.model_validate(message_model).model_dump(mode="json")

    await sio.emit("new_message", message_out, room=f"project_{payload.project_id}")
    logger.info(
        "chat message broadcast",
        extra={"project_id": payload.project_id, "user_id": payload.user_id},
    )

