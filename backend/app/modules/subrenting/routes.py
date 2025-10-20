"""FastAPI routes for the sub-renting module."""

from __future__ import annotations

from typing import Iterable
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.modules.auth.deps import get_db, require_role
from .models import PartnerAvailability, PartnerCapacity, SubRentingPartner
from .partner_api import PartnerAPIClient, PartnerAPIClientError
from .schemas import (
    AvailabilityBase,
    AvailabilityCreate,
    AvailabilityResponse,
    CapacityCreate,
    CapacityResponse,
    PartnerCreate,
    PartnerResponse,
)

router = APIRouter(prefix="/subrenting", tags=["subrenting"])


def _get_partner(db: Session, partner_id: UUID) -> SubRentingPartner:
    partner = db.get(SubRentingPartner, str(partner_id))
    if partner is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Partner niet gevonden")
    return partner


def _sync_partner_availability(partner: SubRentingPartner, records: Iterable[PartnerAvailability]) -> None:
    if not partner.api_endpoint or not partner.api_key:
        return

    client = PartnerAPIClient(partner.api_endpoint, partner.api_key)
    try:
        client.sync_availability(records)
    except PartnerAPIClientError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Partner synchronisatie mislukt: {exc}") from exc


@router.post("/partners", response_model=PartnerResponse, status_code=status.HTTP_201_CREATED)
def create_partner(
    payload: PartnerCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role("admin")),
) -> PartnerResponse:
    partner = SubRentingPartner(
        name=payload.name,
        api_endpoint=payload.api_endpoint,
        api_key=payload.api_key,
        contact_email=payload.contact_email,
        location=payload.location,
    )
    db.add(partner)
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Kon subrenting-partner niet opslaan",
        ) from exc

    db.refresh(partner)
    return PartnerResponse.model_validate(partner)


@router.get("/partners", response_model=list[PartnerResponse])
def list_partners(
    db: Session = Depends(get_db),
    _: object = Depends(require_role("admin", "planner")),
) -> list[PartnerResponse]:
    partners = db.query(SubRentingPartner).order_by(SubRentingPartner.name).all()
    return [PartnerResponse.model_validate(partner) for partner in partners]


@router.post(
    "/partners/{partner_id}/capacities",
    response_model=CapacityResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_capacity(
    partner_id: UUID,
    payload: CapacityCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role("admin", "planner")),
) -> CapacityResponse:
    partner = _get_partner(db, partner_id)
    capacity = PartnerCapacity(
        partner_id=partner.id,
        vehicle_type=payload.vehicle_type,
        quantity=payload.quantity,
        price_per_unit=payload.price_per_unit,
        currency=payload.currency.upper(),
        valid_from=payload.valid_from,
        valid_to=payload.valid_to,
    )
    db.add(capacity)
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Kon capaciteit niet opslaan") from exc

    db.refresh(capacity)
    return CapacityResponse.model_validate(capacity)


@router.post(
    "/partners/{partner_id}/availability",
    response_model=AvailabilityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_availability(
    partner_id: UUID,
    payload: AvailabilityCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role("admin", "planner")),
) -> AvailabilityResponse:
    partner = _get_partner(db, partner_id)
    availability = PartnerAvailability(
        partner_id=partner.id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        status=payload.status,
    )
    db.add(availability)
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Kon beschikbaarheid niet opslaan") from exc

    db.refresh(availability)
    _sync_partner_availability(partner, [availability])
    return AvailabilityResponse.model_validate(availability)


@router.put("/availability/{availability_id}", response_model=AvailabilityResponse)
def update_availability(
    availability_id: UUID,
    payload: AvailabilityBase,
    db: Session = Depends(get_db),
    _: object = Depends(require_role("admin", "planner")),
) -> AvailabilityResponse:
    record = db.get(PartnerAvailability, str(availability_id))
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Beschikbaarheid niet gevonden")

    for field, value in payload.model_dump().items():
        setattr(record, field, value)

    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Kon beschikbaarheid niet bijwerken") from exc

    db.refresh(record)
    partner = _get_partner(db, UUID(record.partner_id))
    _sync_partner_availability(partner, [record])
    return AvailabilityResponse.model_validate(record)
