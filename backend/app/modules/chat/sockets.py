"""Socket.IO event handlers for the chat module."""

from __future__ import annotations

from typing import Optional

from socketio import AsyncServer

from app.core.db import SessionLocal
from app.modules.chat.repo import ChatRepo
from app.modules.chat.schemas import MessageOut

_sio: Optional[AsyncServer] = None


def register_socket_server(server: AsyncServer) -> None:
    global _sio
    _sio = server


def _require_server() -> AsyncServer:
    if _sio is None:
        raise RuntimeError("Socket server has not been initialised")
    return _sio


async def send_message(sid: str, data: dict) -> None:
    """Persist an incoming message and broadcast it to the project room."""

    sio = _require_server()

    project_id = data.get("project_id")
    content = data.get("content")
    user_id = data.get("user_id")

    if not project_id or not content or not user_id:
        await sio.emit("error", {"message": "Missing project_id, content or user_id"}, room=sid)
        return

    with SessionLocal() as db:
        repo = ChatRepo(db)
        message_model = repo.create_message(
            project_id=project_id,
            user_id=user_id,
            content=content,
        )

    message_out = MessageOut.model_validate(message_model).model_dump()

    await sio.to(f"project_{project_id}").emit("new_message", message_out)

