"""Partner API helper used to synchronise availability with external providers."""

from __future__ import annotations

from datetime import datetime
import logging
from typing import Iterable

import httpx

from .models import PartnerAvailability

logger = logging.getLogger(__name__)


class PartnerAPIClientError(RuntimeError):
    """Raised when the partner API returns an error response."""


class PartnerAPIClient:
    """Lightweight HTTP client for partner integrations."""

    def __init__(
        self,
        base_url: str,
        api_key: str,
        *,
        timeout: float = 10.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def sync_availability(self, availabilities: Iterable[PartnerAvailability]) -> dict[str, object]:
        """Push availability records to the partner API.

        The call is intentionally tolerant: any network failure is logged and
        re-raised as :class:`PartnerAPIClientError` so the caller can decide
        whether to fail the request or continue with degraded sync.
        """

        payload = [self._format_availability(avail) for avail in availabilities]
        if not payload:
            return {"status": "skipped", "reason": "no-availability"}

        url = f"{self.base_url}/availability/sync"
        try:
            response = httpx.post(url, json=payload, headers=self._headers(), timeout=self.timeout)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.error("Availability sync with partner API failed: %s", exc)
            raise PartnerAPIClientError(str(exc)) from exc

        return response.json()

    def push_reservation(self, availability_id: str, reservation_details: dict[str, object]) -> dict[str, object]:
        """Push reservation details to the partner system."""

        url = f"{self.base_url}/reservations"
        payload = {"availability_id": availability_id, **reservation_details}
        try:
            response = httpx.post(url, json=payload, headers=self._headers(), timeout=self.timeout)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.error("Reservation sync with partner API failed: %s", exc)
            raise PartnerAPIClientError(str(exc)) from exc

        return response.json()

    @staticmethod
    def _format_availability(availability: PartnerAvailability) -> dict[str, object]:
        return {
            "slot_id": str(availability.id),
            "partner_id": str(availability.partner_id),
            "start_time": _isoformat(availability.start_time),
            "end_time": _isoformat(availability.end_time),
            "status": availability.status,
        }


def _isoformat(value: datetime | None) -> str | None:
    return value.isoformat() if value else None