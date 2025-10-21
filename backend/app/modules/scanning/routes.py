"""API routes for processing equipment scans."""

from __future__ import annotations

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2.shape import to_shape
from pydantic import BaseModel, Field, field_validator
from shapely.geometry import Point, shape
from sqlalchemy.orm import Session

from app.modules.auth.deps import get_current_user, get_db
from app.modules.auth.models import User

from .exceptions import AssetNotFoundException, InvalidScanException, LocationValidationException
from .models import ScanHistory
from .scanner import ScannerService
from .validator import ScanValidator

router = APIRouter(prefix="/scans", tags=["scanning"])


class LocationSchema(BaseModel):
    type: str = Field(..., pattern="^Point$")
    coordinates: List[float] = Field(..., min_items=2, max_items=3)

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, value: List[float]) -> List[float]:
        if not (-180 <= value[0] <= 180):
            raise ValueError("Longitude out of range")
        if not (-90 <= value[1] <= 90):
            raise ValueError("Latitude out of range")
        return value


class ScanData(BaseModel):
    barcode: str = Field(..., min_length=3, max_length=255)
    scan_location: LocationSchema
    timestamp: datetime

    @field_validator("barcode")
    @classmethod
    def validate_barcode_format(cls, value: str) -> str:
        if not value.isalnum():
            raise ValueError("Barcode must be alphanumeric")
        return value.strip()


class ScanResponse(BaseModel):
    scan_id: int
    asset_id: int
    message: str


class ScanHistoryResponse(BaseModel):
    id: int
    barcode: str
    scan_time: datetime
    location: LocationSchema
    asset_id: int
    user_id: int


@router.post("/submit", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
def submit_scan(
    scan_data: ScanData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScanResponse:
    validator = ScanValidator(db)
    scanner_service = ScannerService(db, validator)

    try:
        result = scanner_service.process_scan(
            barcode=scan_data.barcode,
            user=current_user,
            scan_time=scan_data.timestamp,
            location=shape(scan_data.scan_location.model_dump()),
        )
    except AssetNotFoundException as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except (InvalidScanException, LocationValidationException) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return ScanResponse(
        scan_id=result.scan_id,
        asset_id=result.asset_id,
        message="Scan processed successfully",
    )


@router.get("/history", response_model=List[ScanHistoryResponse])
def get_scan_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
) -> List[ScanHistoryResponse]:
    statement = ScanHistory.get_user_history(current_user.id, limit, offset)
    result = db.execute(statement)
    records = result.scalars().all()

    responses: List[ScanHistoryResponse] = []
    for record in records:
        geo_point = to_shape(record.location)
        if isinstance(geo_point, Point):
            coordinates = [geo_point.x, geo_point.y]
        elif isinstance(geo_point, (list, tuple)) and len(geo_point) >= 2:
            coordinates = [float(geo_point[0]), float(geo_point[1])]
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid geometry stored for scan history",
            )

        responses.append(
            ScanHistoryResponse(
                id=record.id,
                barcode=record.barcode,
                scan_time=record.scan_time,
                location=LocationSchema(type="Point", coordinates=coordinates),
                asset_id=record.asset_id,
                user_id=record.user_id,
            )
        )

    return responses


__all__ = ["router"]
