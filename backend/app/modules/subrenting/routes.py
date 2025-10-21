"""FastAPI routes for sub-renting partners and capacity management."""

from __future__ import annotations

import logging
from typing import List
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
from .partner_api import PartnerAPIClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subrenting", tags=["subrenting"])


async def _ensure_admin(user: User) -> None:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")


@router.post("/partners", response_model=schemas.PartnerResponse, status_code=status.HTTP_201_CREATED)
async def create_partner(
    partner: schemas.PartnerCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> schemas.PartnerResponse:
    """Create a new sub-renting partner with API credentials."""

    await _ensure_admin(current_user)

    db_partner = SubRentingPartner(**partner.model_dump())
    db.add(db_partner)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Partner already exists") from exc

    await db.refresh(db_partner)
    return db_partner


@router.get("/partners", response_model=List[schemas.PartnerResponse])
async def get_partners(
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> List[schemas.PartnerResponse]:
    """List all sub-renting partners."""

    await _ensure_admin(current_user)

    result = await db.execute(select(SubRentingPartner))
    return result.scalars().all()


@router.post("/partners/{partner_id}/capacities", response_model=schemas.CapacityResponse, status_code=status.HTTP_201_CREATED)
async def add_capacity(
    partner_id: UUID,
    capacity: schemas.CapacityCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> schemas.CapacityResponse:
    """Add a capacity entry for a partner."""

    await _ensure_admin(current_user)

    partner = await db.get(SubRentingPartner, partner_id)
    if partner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")

    db_capacity = PartnerCapacity(partner_id=partner_id, **capacity.model_dump())
    db.add(db_capacity)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to add capacity") from exc

    await db.refresh(db_capacity)
    return db_capacity


@router.post("/partners/{partner_id}/availability", response_model=schemas.AvailabilityResponse, status_code=status.HTTP_201_CREATED)
async def create_availability(
    partner_id: UUID,
    availability: schemas.AvailabilityCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> schemas.AvailabilityResponse:
    """Create a new availability slot for a partner."""

    await _ensure_admin(current_user)

    partner = await db.get(SubRentingPartner, partner_id)
    if partner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")

    db_availability = PartnerAvailability(partner_id=partner_id, **availability.model_dump())
    db.add(db_availability)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create availability") from exc

    await db.refresh(db_availability)

    try:
        client = PartnerAPIClient(partner.api_endpoint, partner.api_key)
        await client.sync_availability([db_availability])
    except Exception as exc:  # pragma: no cover - network issues handled gracefully
        logger.warning("Partner availability sync failed: %s", exc)

    return db_availability


    db.refresh(availability)
    _sync_partner_availability(partner, [availability])
    return AvailabilityResponse.model_validate(availability)


@router.put("/availability/{availability_id}", response_model=AvailabilityResponse)
def update_availability(
    availability_id: UUID,
    availability: schemas.AvailabilityBase,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> schemas.AvailabilityResponse:
    """Update an availability slot."""

    await _ensure_admin(current_user)

    db_availability = await db.get(PartnerAvailability, availability_id)
    if db_availability is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Availability not found")

    for key, value in availability.model_dump(exclude_unset=True).items():
        setattr(db_availability, key, value)

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update availability") from exc

    await db.refresh(db_availability)

    partner = await db.get(SubRentingPartner, db_availability.partner_id)
    if partner:
        try:
            client = PartnerAPIClient(partner.api_endpoint, partner.api_key)
            await client.sync_availability([db_availability])
        except Exception as exc:  # pragma: no cover - network issues handled gracefully
            logger.warning("Partner availability sync failed: %s", exc)

    return db_availability
