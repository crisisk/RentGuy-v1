"""Database models supporting the scanning module."""

from __future__ import annotations

from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, ForeignKey, Integer, String, func, select
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Asset(Base):
    """Inventory asset that can be scanned."""

    __tablename__ = "scan_assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    barcode: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    item_id: Mapped[int | None] = mapped_column(ForeignKey("inv_items.id"), nullable=True)
    location = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=True)

    item = relationship("app.modules.inventory.models.Item", lazy="joined")
    history_entries: Mapped[list["ScanHistory"]] = relationship(
        "ScanHistory",
        back_populates="asset",
        cascade="all,delete-orphan",
    )


class ScanHistory(Base):
    """Audit trail for scans performed in the system."""

    __tablename__ = "scan_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    barcode: Mapped[str] = mapped_column(String(255), index=True)
    scan_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    location = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    asset_id: Mapped[int] = mapped_column(ForeignKey("scan_assets.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("auth_users.id"), nullable=False)

    asset: Mapped[Asset] = relationship("Asset", back_populates="history_entries")
    user = relationship("app.modules.auth.models.User")

    @classmethod
    def get_user_history(cls, user_id: int, limit: int, offset: int):
        """Return a selectable for fetching history items for a user."""

        return (
            select(cls)
            .where(cls.user_id == user_id)
            .order_by(cls.scan_time.desc())
            .limit(limit)
            .offset(offset)
        )


__all__ = ["Asset", "ScanHistory"]
