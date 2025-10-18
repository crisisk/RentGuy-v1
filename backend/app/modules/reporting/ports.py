"""Reporting service interface definitions."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Sequence

from .schemas import AlertOut, MarginRow


class ReportingPort(ABC):
    @abstractmethod
    def margins(self) -> Sequence[MarginRow]:
        """Return aggregated margin rows per project."""

    @abstractmethod
    def expiring_maintenance_alerts(self) -> Sequence[AlertOut]:
        """Return alerts for maintenance events that are about to expire."""

    @abstractmethod
    def low_stock_alerts(self) -> Sequence[AlertOut]:
        """Return alerts for inventory items that fall below minimum stock."""

    @abstractmethod
    def double_booking_alerts(self) -> Sequence[AlertOut]:
        """Return alerts for potential double bookings."""

    @abstractmethod
    def alert_summary(self) -> Sequence[AlertOut]:
        """Return a combined feed of all alert categories."""

