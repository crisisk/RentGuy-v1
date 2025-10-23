"""FastAPI routes for sub-renting partners and capacity management."""

from __future__ import annotations

import logging
from inspect import isawaitable
from typing import Sequence
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.modules.auth.deps import get_current_user
from app.modules.auth.models import User

from . import schemas
from .models import PartnerAvailability, PartnerCapacity, SubRentingPartner
from .partner_api import PartnerAPIClient, PartnerAPIClientError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subrenting", tags=["subrenting"])


def _require_admin(user: User) -> User:
    """Ensure the current user has administrative privileges."""

    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return user


@router.post(
    "/partners",
    response_model=schemas.PartnerResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_partner(
    partner: schemas.PartnerCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> schemas.PartnerResponse:
    """Create a new sub-renting partner with API credentials."""

    _require_admin(current_user)

    db_partner = SubRentingPartner(**partner.model_dump())
    db.add(db_partner)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Partner already exists") from exc

    await db.refresh(db_partner)
    return db_partner


@router.get("/partners", response_model=list[schemas.PartnerResponse])
async def get_partners(
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> list[schemas.PartnerResponse]:
    """List all registered sub-renting partners."""

    _require_admin(current_user)

    result = await db.execute(select(SubRentingPartner).order_by(SubRentingPartner.name))
    return list(result.scalars().all())


@router.post(
    "/partners/{partner_id}/capacities",
    response_model=schemas.CapacityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_capacity(
    partner_id: UUID,
    capacity: schemas.CapacityCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> schemas.CapacityResponse:
    """Add a capacity entry for a partner."""

    _require_admin(current_user)

    partner = await db.get(SubRentingPartner, partner_id)
    if partner is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Partner not found")

    db_capacity = PartnerCapacity(partner_id=partner_id, **capacity.model_dump())
    db.add(db_capacity)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Failed to add capacity") from exc

    await db.refresh(db_capacity)
    return db_capacity


@router.post(
    "/partners/{partner_id}/availability",
    response_model=schemas.AvailabilityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_availability(
    partner_id: UUID,
    availability: schemas.AvailabilityCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> schemas.AvailabilityResponse:
    """Create a new availability slot for a partner."""

    _require_admin(current_user)

    partner = await db.get(SubRentingPartner, partner_id)
    if partner is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Partner not found")

    db_availability = PartnerAvailability(partner_id=partner_id, **availability.model_dump())
    db.add(db_availability)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Failed to create availability") from exc

    await db.refresh(db_availability)
    await _sync_partner_availability(partner, [db_availability])
    return db_availability


async def _sync_partner_availability(
    partner: SubRentingPartner,
    availabilities: Sequence[PartnerAvailability],
) -> None:
    """Best-effort propagation of availability slots to partner systems."""

    if not availabilities:
        return

    client = PartnerAPIClient(partner.api_endpoint, partner.api_key)
    try:
        result = client.sync_availability(availabilities)
        if isawaitable(result):
            await result
    except PartnerAPIClientError as exc:  # pragma: no cover - network guard
        logger.warning("Partner availability sync failed: %s", exc)
    except Exception as exc:  # pragma: no cover - defensive guard
        logger.warning("Partner availability sync failed: %s", exc)


__all__ = ["router"]
