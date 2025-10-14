"""Socket.IO event handlers for crew related real-time features."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from geoalchemy2.elements import WKTElement
from socketio import AsyncServer
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.modules.crew.models import Location

_sio: Optional[AsyncServer] = None


def register_socket_server(server: AsyncServer) -> None:
    """Register the Socket.IO server instance used by the event handlers."""

    global _sio
    _sio = server


def _require_server() -> AsyncServer:
    if _sio is None:
        raise RuntimeError("Socket server has not been initialised")
    return _sio


def _update_location_record(
    db: Session,
    *,
    user_id: int,
    latitude: float,
    longitude: float,
    project_id: Optional[int],
    accuracy: Optional[float],
    speed: Optional[float],
    heading: Optional[float],
) -> Dict[str, Any]:
    point = WKTElement(f"POINT({longitude} {latitude})", srid=4326)

    existing_location = db.query(Location).filter(Location.user_id == user_id).first()

    if existing_location:
        existing_location.geom = point
        existing_location.timestamp = datetime.now()
        existing_location.accuracy = accuracy
        existing_location.speed = speed
        existing_location.heading = heading
        existing_location.project_id = project_id
    else:
        location = Location(
            user_id=user_id,
            geom=point,
            accuracy=accuracy,
            speed=speed,
            heading=heading,
            project_id=project_id,
        )
        db.add(location)

    db.commit()

    return {
        "user_id": user_id,
        "latitude": latitude,
        "longitude": longitude,
        "timestamp": datetime.now().isoformat(),
        "project_id": project_id,
        "accuracy": accuracy,
        "speed": speed,
        "heading": heading,
    }


async def connect(sid: str, environ: dict) -> None:
    """Accept incoming socket connections."""

    print(f"Client connected: {sid}")


def disconnect(sid: str) -> None:
    """Log socket disconnections."""

    print(f"Client disconnected: {sid}")


async def join_project(sid: str, data: dict) -> None:
    project_id = data.get("project_id")
    if not project_id:
        return

    sio = _require_server()
    sio.enter_room(sid, f"project_{project_id}")
    await sio.emit("status", {"message": f"Joined project {project_id}"}, room=sid)


async def leave_project(sid: str, data: dict) -> None:
    project_id = data.get("project_id")
    if not project_id:
        return

    sio = _require_server()
    sio.leave_room(sid, f"project_{project_id}")
    await sio.emit("status", {"message": f"Left project {project_id}"}, room=sid)


async def update_location(sid: str, data: dict) -> None:
    """Persist and broadcast crew location updates."""

    sio = _require_server()

    try:
        latitude = float(data["latitude"])
        longitude = float(data["longitude"])
        user_id = int(data["user_id"])
    except (KeyError, TypeError, ValueError):
        await sio.emit("error", {"message": "Invalid location payload"}, room=sid)
        return

    project_id = data.get("project_id")
    accuracy = data.get("accuracy")
    speed = data.get("speed")
    heading = data.get("heading")

    with SessionLocal() as db:
        location_data = _update_location_record(
            db,
            user_id=user_id,
            latitude=latitude,
            longitude=longitude,
            project_id=project_id,
            accuracy=accuracy,
            speed=speed,
            heading=heading,
        )

    if project_id:
        await sio.to(f"project_{project_id}").emit("location_update", location_data)

    await sio.to("managers").emit("location_update", location_data)

