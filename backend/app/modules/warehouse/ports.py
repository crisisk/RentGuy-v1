"""Warehouse service interfaces."""
from __future__ import annotations

from abc import ABC, abstractmethod

from .schemas import ScanIn, ScanResult, TagResolution, TagUpsertIn


class WarehouseServicePort(ABC):
    @abstractmethod
    def resolve_tag(self, tag_value: str) -> TagResolution:
        """Resolve a tag to its inventory subject."""

    @abstractmethod
    def upsert_tag(self, payload: TagUpsertIn) -> TagResolution:
        """Create or update a tag mapping."""

    @abstractmethod
    def register_scan(self, payload: ScanIn) -> ScanResult:
        """Record a scan operation and return the resulting movements."""

