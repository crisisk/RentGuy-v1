"""Calendar synchronisation service boundary."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Sequence

from .models import CalendarAccount
from .schemas import (
    CalendarAccountCreate,
    CalendarAccountOut,
    CalendarSyncRequest,
    CalendarSyncResult,
    OAuthConnectResponse,
    TokenExchangeIn,
)


class CalendarSyncPort(ABC):
    @abstractmethod
    def list_accounts(self, user_id: int | None = None) -> Sequence[CalendarAccount]:
        """Return calendar accounts optionally scoped to a user."""

    @abstractmethod
    def start_connection(
        self, *, user_id: int, payload: CalendarAccountCreate
    ) -> OAuthConnectResponse:
        """Initialise an OAuth flow for the given provider."""

    @abstractmethod
    def exchange_token(
        self, *, user_id: int, payload: TokenExchangeIn
    ) -> CalendarAccountOut:
        """Persist tokens returned by the OAuth provider."""

    @abstractmethod
    def sync_bookings(
        self, *, user_id: int, request: CalendarSyncRequest
    ) -> CalendarSyncResult:
        """Synchronise crew bookings to the provider."""

