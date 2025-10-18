"""
Scan validation service with business rules
"""
from datetime import datetime, timedelta
from typing import Optional
from geoalchemy2 import WKBElement
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.asset import Asset
from models.scan_history import ScanHistory
from models.user import User
from .exceptions import (
    AssetNotFoundException,
    InvalidScanException,
    LocationValidationException
)

class ScanValidator:
    """Validates scans against business rules and data quality checks"""
    
    def __init__(self, db: AsyncSession):
        self.db = db

    async def validate_scan(
        self,
        barcode: str,
        user: User,
        location: WKBElement
    ) -> None:
        """
        Perform comprehensive scan validation

        Args:
            barcode: Scanned asset identifier
            user: Scanning user account
            location: Geographic point of scan

        Raises:
            AssetNotFoundException: If asset doesn't exist
            LocationValidationException: For invalid locations
            InvalidScanException: For invalid/duplicate scans
        """
        # Check asset existence
        asset_exists = await self._asset_exists(barcode)
        if not asset_exists:
            raise AssetNotFoundException(f"Asset {barcode} not found")

        # Check duplicate scans
        if await self._is_duplicate_scan(barcode, user.id):
            raise InvalidScanException("Duplicate scan within cooldown period")

        # Validate location permissions
        if not await self._validate_location(user, location):
            raise LocationValidationException(
                "User not authorized for this scan location"
            )

    async def _asset_exists(self, barcode: str) -> bool:
        """Check if asset exists in database"""
        result = await self.db.execute(
            select(Asset.id).where(Asset.barcode == barcode)
        )
        return result.scalar() is not None

    async def _is_duplicate_scan(
        self,
        barcode: str,
        user_id: int
    ) -> bool:
        """Check for duplicate scans in past 5 minutes"""
        time_threshold = datetime.utcnow() - timedelta(minutes=5)
        
        result = await self.db.execute(
            select(ScanHistory.id).where(
                and_(
                    ScanHistory.barcode == barcode,
                    ScanHistory.user_id == user_id,
                    ScanHistory.scan_time >= time_threshold
                )
            )
        )
        return result.scalar() is not None

    async def _validate_location(
        self,
        user: User,
        scan_location: WKBElement
    ) -> bool:
        """
        Validate user is authorized to scan at this location
        
        Simplified example: Check if scan is within user's allowed regions
        """
        # In production this would query user's allowed locations
        # Here we implement a basic 10km radius check from home base
        home_base = await self._get_user_home_base(user.id)
        if not home_base:
            return False

        # Using PostGIS ST_DWithin in production
        # Simplified here for demonstration
        return self._calculate_distance(
            (home_base.x, home_base.y),
            (scan_location.x, scan_location.y)
        ) <= 10000  # 10km radius

    async def _get_user_home_base(self, user_id: int) -> Optional[Point]:
        """Retrieve user's home base location (simplified)"""
        # In real implementation this would come from user profile
        return Point(4.895168, 52.370216)  # Amsterdam coordinates

    def _calculate_distance(
        self,
        point1: Tuple[float, float],
        point2: Tuple[float, float]
    ) -> float:
        """Simplified distance calculation (Haversine in production)"""
        # For demo purposes only - use proper geodesic calculation
        from math import sqrt
        return sqrt((point1[0]-point2[0])**2 + (point1[1]-point2[1])**2) * 111000