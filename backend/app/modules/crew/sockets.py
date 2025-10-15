"""Socket.IO event handlers for crew related real-time features."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from geoalchemy2.elements import WKTElement
from pydantic import ValidationError
from socketio import AsyncServer
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.modules.crew.models import Location
from app.modules.crew.schemas import LocationBroadcast, LocationUpdateIn

logger = logging.getLogger(__name__)

_sio: Optional[AsyncServer] = None


def register_socket_server(server: AsyncServer) -> None:
    """Register the Socket.IO server instance used by the event handlers."""

    global _sio
    _sio = server


def _require_server() -> AsyncServer:
    if _sio is None:  # pragma: no cover - defensive guard
        raise RuntimeError("Socket server has not been initialised")
    return _sio


def _parse_project_id(data: dict) -> int:
    try:
        return int(data["project_id"])
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError("Invalid project_id") from exc


def _update_location_record(
    db: Session,
    payload: LocationUpdateIn,
    event_time: datetime,
) -> LocationBroadcast:
    point_wkt = f"POINT({payload.longitude} {payload.latitude})"
    try:
        point = WKTElement(point_wkt, srid=4326)
    except TypeError:
        point = WKTElement(point_wkt)

    location = db.query(Location).filter(Location.user_id == payload.user_id).one_or_none()

    if location is None:
        location = Location(
            user_id=payload.user_id,
            geom=point,
            timestamp=event_time,
            accuracy=payload.accuracy,
            speed=payload.speed,
            heading=payload.heading,
            project_id=payload.project_id,
        )
        db.add(location)
    else:
        location.geom = point
        location.timestamp = event_time
        location.accuracy = payload.accuracy
        location.speed = payload.speed
        location.heading = payload.heading
        location.project_id = payload.project_id

    db.flush()

    return LocationBroadcast(
        user_id=payload.user_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        timestamp=event_time,
        project_id=payload.project_id,
        accuracy=payload.accuracy,
        speed=payload.speed,
        heading=payload.heading,
    )


async def connect(sid: str, environ: dict) -> None:  # pragma: no cover - integration hook
    """Accept incoming socket connections."""

    logger.info("crew socket connected", extra={"sid": sid})


def disconnect(sid: str) -> None:  # pragma: no cover - integration hook
    """Log socket disconnections."""

    logger.info("crew socket disconnected", extra={"sid": sid})


async def join_project(sid: str, data: dict) -> None:
    sio = _require_server()

    try:
        project_id = _parse_project_id(data)
    except ValueError:
        await sio.emit("error", {"message": "Invalid project_id"}, room=sid)
        logger.warning("join_project rejected", extra={"sid": sid, "payload": data})
        return

    await sio.enter_room(sid, f"project_{project_id}")
    await sio.emit("status", {"message": f"Joined project {project_id}"}, room=sid)
    logger.info("sid joined project", extra={"sid": sid, "project_id": project_id})


async def leave_project(sid: str, data: dict) -> None:
    sio = _require_server()

    try:
        project_id = _parse_project_id(data)
    except ValueError:
        await sio.emit("error", {"message": "Invalid project_id"}, room=sid)
        logger.warning("leave_project rejected", extra={"sid": sid, "payload": data})
        return

    await sio.leave_room(sid, f"project_{project_id}")
    await sio.emit("status", {"message": f"Left project {project_id}"}, room=sid)
    logger.info("sid left project", extra={"sid": sid, "project_id": project_id})


async def update_location(sid: str, data: dict) -> None:
    """Persist and broadcast crew location updates."""

    sio = _require_server()

    try:
        payload = LocationUpdateIn.model_validate(data)
    except ValidationError as exc:
        logger.warning(
            "Invalid location payload",
            extra={"sid": sid, "errors": exc.errors(), "payload": data},
        )
        await sio.emit(
            "error",
            {"message": "Invalid location payload", "details": exc.errors()},
            room=sid,
        )
        return

    event_time = datetime.now(timezone.utc)

    try:
        with SessionLocal() as db:
            broadcast = _update_location_record(db, payload, event_time)
            db.commit()
    except SQLAlchemyError:
        logger.exception(
            "Failed to persist crew location",
            extra={"sid": sid, "user_id": payload.user_id},
        )
        await sio.emit(
            "error",
            {"message": "Failed to persist crew location"},
            room=sid,
        )
        return

    socket_payload = broadcast.to_socket_payload()

    if payload.project_id is not None:
        await sio.emit(
            "location_update",
            socket_payload,
            room=f"project_{payload.project_id}",
        )

    await sio.emit("location_update", socket_payload, room="managers")

