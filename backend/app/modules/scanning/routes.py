"""
Scanning routes for barcode/QR processing and history tracking
"""
from datetime import datetime
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from geoalchemy2 import WKBElement
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, shape
from sqlalchemy.ext.asyncio import AsyncSession

from auth.auth_store import get_current_user
from database.database import get_db
from models.asset import Asset
from models.scan_history import ScanHistory
from models.user import User
from .exceptions import InvalidScanException, AssetNotFoundException, LocationValidationException
from .validator import ScanValidator

router = APIRouter(prefix="/scans", tags=["scanning"])

class LocationSchema(BaseModel):
    """GeoJSON Point schema for location data"""
    type: str = Field(..., pattern="^Point$")
    coordinates: List[float] = Field(..., min_items=2, max_items=3)

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, v):
        """Validate geographic coordinates"""
        if not (-180 <= v[0] <= 180):
            raise ValueError("Longitude out of range")
        if not (-90 <= v[1] <= 90):
            raise ValueError("Latitude out of range")
        return v

class ScanData(BaseModel):
    """Scan submission schema with validation"""
    barcode: str = Field(..., min_length=3, max_length=255)
    scan_location: LocationSchema
    timestamp: datetime

    @field_validator("barcode")
    @classmethod
    def validate_barcode_format(cls, v):
        """Basic barcode format validation"""
        if not v.isalnum():
            raise ValueError("Barcode must be alphanumeric")
        return v.strip()

class ScanResponse(BaseModel):
    """Response model for successful scans"""
    scan_id: int
    asset_id: int
    message: str

class ScanHistoryResponse(BaseModel):
    """Scan history record response model"""
    id: int
    barcode: str
    scan_time: datetime
    location: LocationSchema
    asset_id: int
    user_id: int

@router.post(
    "/submit",
    response_model=ScanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new scan"
)
async def submit_scan(
    scan_data: ScanData,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Process and validate a new barcode/QR scan

    Args:
        scan_data: Validated scan data from request body
        current_user: Authenticated user from JWT
        db: Async database session

    Returns:
        ScanResponse: Processed scan details

    Raises:
        HTTPException: 400 for invalid scans, 404 for missing assets
    """
    try:
        # Convert GeoJSON to WKB
        point = shape(scan_data.scan_location.model_dump())
        wkb_location = from_shape(point, srid=4326)

        # Process scan through service layer
        validator = ScanValidator(db)
        scanner_service = ScannerService(db, validator)
        
        result = await scanner_service.process_scan(
            barcode=scan_data.barcode,
            user=current_user,
            scan_time=scan_data.timestamp,
            location=wkb_location
        )

        return ScanResponse(
            scan_id=result.scan_id,
            asset_id=result.asset_id,
            message="Scan processed successfully"
        )

    except AssetNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        ) from e
    except (InvalidScanException, LocationValidationException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e

@router.get(
    "/history",
    response_model=List[ScanHistoryResponse],
    summary="Get scan history for current user"
)
async def get_scan_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 100,
    offset: int = 0
):
    """
    Retrieve scan history for the authenticated user

    Args:
        current_user: Authenticated user from JWT
        db: Async database session
        limit: Maximum results to return
        offset: Pagination offset

    Returns:
        List[ScanHistoryResponse]: User's scan records
    """
    result = await db.execute(
        ScanHistory.get_user_history(current_user.id, limit, offset)
    )
    scans = result.scalars().all()
    
    history = []
    for scan in scans:
        # Convert WKB to GeoJSON
        point = to_shape(scan.location)
        history.append(ScanHistoryResponse(
            id=scan.id,
            barcode=scan.barcode,
            scan_time=scan.scan_time,
            location=LocationSchema(
                type="Point",
                coordinates=[point.x, point.y]
            ),
            asset_id=scan.asset_id,
            user_id=scan.user_id
        ))
    
    return history