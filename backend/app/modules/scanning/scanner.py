"""Service layer responsible for processing scans."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auth.models import User

from .exceptions import AssetNotFoundException
from .models import Asset, ScanHistory


@dataclass(slots=True)
class ScanResult:
    """Simple value object returned after a successful scan."""

    scan_id: int
    asset_id: int


class ScannerService:
    """Business logic for processing inventory scans."""

    def __init__(self, db: Session, validator: "ScanValidator") -> None:
        self.db = db
        self.validator = validator

    def process_scan(
        self,
        *,
        barcode: str,
        user: User,
        scan_time: datetime,
        location: Point,
    ) -> ScanResult:
        """Validate the scan and persist the resulting state changes."""

        self.validator.validate_scan(barcode=barcode, user=user, location=location)

        db_location = from_shape(location, srid=4326)

        asset = self._get_asset_by_barcode(barcode)
        if asset is None:
            raise AssetNotFoundException(f"Asset {barcode} not registered")

        asset.location = db_location
        self.db.add(asset)

        record = ScanHistory(
            barcode=barcode,
            scan_time=scan_time,
            location=db_location,
            asset_id=asset.id,
            user_id=user.id,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        return ScanResult(scan_id=record.id, asset_id=asset.id)

    def _get_asset_by_barcode(self, barcode: str) -> Asset | None:
        statement = select(Asset).where(Asset.barcode == barcode)
        result = self.db.execute(statement)
        return result.scalars().first()


__all__ = ["ScannerService", "ScanResult"]
