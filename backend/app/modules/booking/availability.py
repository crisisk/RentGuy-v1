"""Utilities for calculating reservation availability."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from .models import Equipment, EquipmentStatus, Reservation


def check_availability(
    db: Session,
    equipment_id: int,
    start_time: datetime,
    end_time: datetime,
) -> bool:
    """Return ``True`` when the equipment is available for the supplied window."""

    equipment = db.get(Equipment, equipment_id)
    if equipment is None:
        return False

    if equipment.status != EquipmentStatus.AVAILABLE:
        return False

    conflict = db.execute(
        select(Reservation)
        .where(
            Reservation.equipment_id == equipment_id,
            Reservation.cancelled.is_(False),
            or_(
                and_(
                    Reservation.start_time < end_time,
                    Reservation.end_time > start_time,
                ),
                and_(
                    Reservation.start_time >= start_time,
                    Reservation.end_time <= end_time,
                ),
            ),
        )
        .limit(1)
    ).scalars().first()

    return conflict is None
