"""
Equipment availability checking logic
"""
from datetime import datetime
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Equipment, Reservation, EquipmentStatus

async def check_availability(
    db: AsyncSession,
    equipment_id: int,
    start_time: datetime,
    end_time: datetime
) -> bool:
    """
    Validate reservation availability for equipment

    Args:
        db: Database session
        equipment_id: Target equipment ID
        start_time: Reservation start (UTC)
        end_time: Reservation end (UTC)

    Returns:
        bool: True if available, False if conflicting

    Test Scenarios:
        1. No conflicts - returns True
        2. Existing reservation in time range - returns False
        3. Equipment in maintenance - returns False
    """
    # Check equipment status
    equipment = await db.get(Equipment, equipment_id)
    if equipment.status != EquipmentStatus.AVAILABLE:
        return False

    # Check existing reservations
    conflict = await db.execute(
        select(Reservation)
        .where(
            Reservation.equipment_id == equipment_id,
            Reservation.cancelled == False,
            or_(
                and_(
                    Reservation.start_time < end_time,
                    Reservation.end_time > start_time
                ),
                and_(
                    Reservation.start_time >= start_time,
                    Reservation.end_time <= end_time
                )
            )
        )
        .limit(1)
    )
    
    return not conflict.scalars().first()