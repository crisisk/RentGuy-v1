"""
Scan processing service layer with business logic
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple
from geoalchemy2 import WKBElement
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.asset import Asset
from models.scan_history import ScanHistory
from .exceptions import (
    AssetNotFoundException,
    InvalidScanException,
    LocationValidationException
)

class ScannerService:
    """Core scanning service handling business logic"""
    
    def __init__(self, db: AsyncSession, validator: "ScanValidator"):
        self.db = db
        self.validator = validator

    async def process_scan(
        self,
        barcode: str,
        user: "User",
        scan_time: datetime,
        location: WKBElement
    ) -> Tuple[int, int]:
        """
        Process a validated scan and update system state

        Args:
            barcode: Scanned asset barcode
            user: Scanning user instance
            scan_time: Timestamp from client
            location: Geography point as WKB

        Returns:
            Tuple[int, int]: (scan_id, asset_id)

        Raises:
            AssetNotFoundException: If no matching asset exists
            InvalidScanException: For invalid/duplicate scans
            LocationValidationException: For invalid location scans
        """
        # Validate against business rules
        await self.validator.validate_scan(barcode, user, location)
        
        # Get asset details
        asset = await self._get_asset_by_barcode(barcode)
        if not asset:
            raise AssetNotFoundException(f"Asset {barcode} not registered")

        # Update asset location
        asset.location = location
        self.db.add(asset)

        # Create history record
        scan_record = ScanHistory(
            barcode=barcode,
            scan_time=scan_time,
            location=location,
            asset_id=asset.id,
            user_id=user.id
        )
        self.db.add(scan_record)
        await self.db.commit()
        await self.db.refresh(scan_record)

        return (scan_record.id, asset.id)

    async def _get_asset_by_barcode(self, barcode: str) -> Optional[Asset]:
        """Retrieve asset by barcode with async query"""
        result = await self.db.execute(
            select(Asset).where(Asset.barcode == barcode)
        )
        return result.scalars().first()

class ScanResult:
    """Simple data class for scan processing results"""
    
    def __init__(self, scan_id: int, asset_id: int):
        self.scan_id = scan_id
        self.asset_id = asset_id