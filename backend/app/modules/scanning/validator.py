"""Business rule validation for scan submissions."""

from __future__ import annotations

from datetime import datetime, timedelta
from math import asin, cos, radians, sin, sqrt
from typing import Tuple

from shapely.geometry import Point
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.modules.auth.models import User

from .exceptions import AssetNotFoundException, InvalidScanException, LocationValidationException
from .models import Asset, ScanHistory


class ScanValidator:
    """Validates incoming scans against system rules."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def validate_scan(self, *, barcode: str, user: User, location: Point) -> None:
        """Run all validation steps for a scan request."""

        if not self._asset_exists(barcode):
            raise AssetNotFoundException(f"Asset {barcode} not found")

        if self._is_duplicate_scan(barcode=barcode, user_id=user.id):
            raise InvalidScanException("Duplicate scan within cooldown period")

        if not self._validate_location(user=user, scan_location=location):
            raise LocationValidationException("User not authorized for this scan location")

    def _asset_exists(self, barcode: str) -> bool:
        result = self.db.execute(select(Asset.id).where(Asset.barcode == barcode))
        return result.scalar() is not None

    def _is_duplicate_scan(self, *, barcode: str, user_id: int) -> bool:
        time_threshold = datetime.utcnow() - timedelta(minutes=5)
        statement = select(ScanHistory.id).where(
            and_(
                ScanHistory.barcode == barcode,
                ScanHistory.user_id == user_id,
                ScanHistory.scan_time >= time_threshold,
            )
        )
        result = self.db.execute(statement)
        return result.scalar() is not None

    def _validate_location(self, *, user: User, scan_location: Point) -> bool:
        home_base = self._get_user_home_base(user.id)
        if home_base is None:
            return False

        distance = self._calculate_distance(
            (home_base.x, home_base.y),
            (scan_location.x, scan_location.y),
        )
        return distance <= 10_000

    def _get_user_home_base(self, user_id: int) -> Point | None:
        # Placeholder - eventually this should look up a persisted location
        return Point(4.895168, 52.370216)

    def _calculate_distance(self, origin: Tuple[float, float], target: Tuple[float, float]) -> float:
        lon1, lat1 = origin
        lon2, lat2 = target

        lon1, lat1, lon2, lat2 = map(radians, (lon1, lat1, lon2, lat2))

        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        c = 2 * asin(sqrt(a))
        radius_earth_m = 6_371_000
        return radius_earth_m * c


__all__ = ["ScanValidator"]
