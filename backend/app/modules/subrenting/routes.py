"""
FastAPI routes for sub-renting module
Handles partner management, capacity and availability operations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.authStore import get_current_user
from . import schemas, models
from .partner_api import PartnerAPIClient

router = APIRouter(prefix="/subrenting", tags=["subrenting"])

@router.post("/partners", response_model=schemas.PartnerResponse)
async def create_partner(
    partner: schemas.PartnerCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Create new sub-renting partner with API credentials"""
    try:
        db_partner = models.SubRentingPartner(**partner.dict())
        db.add(db_partner)
        await db.commit()
        await db.refresh(db_partner)
        return db_partner
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating partner: {str(e)}"
        )

@router.get("/partners", response_model=List[schemas.PartnerResponse])
async def get_partners(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """List all sub-renting partners"""
    result = await db.execute(models.SubRentingPartner.select())
    return result.scalars().all()

@router.post("/partners/{partner_id}/capacities", response_model=schemas.CapacityResponse)
async def add_capacity(
    partner_id: UUID,
    capacity: schemas.CapacityCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Add capacity entry for a partner"""
    try:
        partner = await db.get(models.SubRentingPartner, partner_id)
        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")
        
        db_capacity = models.PartnerCapacity(**capacity.dict(), partner_id=partner_id)
        db.add(db_capacity)
        await db.commit()
        await db.refresh(db_capacity)
        return db_capacity
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error adding capacity: {str(e)}"
        )

@router.post("/partners/{partner_id}/availability", response_model=schemas.AvailabilityResponse)
async def create_availability(
    partner_id: UUID,
    availability: schemas.AvailabilityCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Create new availability slot for a partner"""
    try:
        partner = await db.get(models.SubRentingPartner, partner_id)
        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")
        
        db_availability = models.PartnerAvailability(**availability.dict(), partner_id=partner_id)
        db.add(db_availability)
        await db.commit()
        await db.refresh(db_availability)
        
        # Sync with partner API
        client = PartnerAPIClient(partner.api_endpoint, partner.api_key)
        await client.sync_availability([db_availability])
        
        return db_availability
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating availability: {str(e)}"
        )

@router.put("/availability/{availability_id}", response_model=schemas.AvailabilityResponse)
async def update_availability(
    availability_id: UUID,
    availability: schemas.AvailabilityBase,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Update availability slot status"""
    try:
        db_availability = await db.get(models.PartnerAvailability, availability_id)
        if not db_availability:
            raise HTTPException(status_code=404, detail="Availability not found")
        
        for key, value in availability.dict().items():
            setattr(db_availability, key, value)
        
        await db.commit()
        await db.refresh(db_availability)
        
        # Sync update with partner
        partner = await db.get(models.SubRentingPartner, db_availability.partner_id)
        client = PartnerAPIClient(partner.api_endpoint, partner.api_key)
        await client.sync_availability([db_availability])
        
        return db_availability
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error updating availability: {str(e)}"
        )