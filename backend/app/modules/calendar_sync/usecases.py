"""Calendar synchronisation business logic."""
from __future__ import annotations

from datetime import datetime, timedelta
import secrets
import urllib.parse
from typing import Sequence

from sqlalchemy.orm import Session

from .models import CalendarAccount
from .ports import CalendarSyncPort
from .repo import CalendarSyncRepo
from .schemas import (
    CalendarAccountCreate,
    CalendarAccountOut,
    CalendarSyncRequest,
    CalendarSyncResult,
    OAuthConnectResponse,
    TokenExchangeIn,
)


class CalendarSyncService(CalendarSyncPort):
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = CalendarSyncRepo(db)

    def list_accounts(self, user_id: int | None = None) -> Sequence[CalendarAccount]:
        return self.repo.list_accounts(user_id=user_id)

    def start_connection(
        self, *, user_id: int, payload: CalendarAccountCreate
    ) -> OAuthConnectResponse:
        account = self.repo.find_account(
            user_id=user_id, provider=payload.provider, account_email=str(payload.account_email)
        )
        if account is None:
            account = CalendarAccount(
                user_id=user_id,
                provider=payload.provider,
                account_email=str(payload.account_email),
                access_token=payload.access_token,
                refresh_token=payload.refresh_token,
                expires_at=payload.expires_at,
                active=True,
            )
            self.repo.add_account(account)
        else:
            self.repo.update_account(
                account,
                access_token=payload.access_token,
                refresh_token=payload.refresh_token,
                expires_at=payload.expires_at,
                active=True,
            )
        self.db.commit()

        state = secrets.token_urlsafe(16)
        auth_url = self._authorization_url(payload.provider, state)
        return OAuthConnectResponse(provider=payload.provider, authorization_url=auth_url, state=state)

    def exchange_token(
        self, *, user_id: int, payload: TokenExchangeIn
    ) -> CalendarAccountOut:
        account = self.repo.find_account(
            user_id=user_id, provider=payload.provider, account_email=str(payload.account_email)
        )
        if account is None:
            account = CalendarAccount(
                user_id=user_id,
                provider=payload.provider,
                account_email=str(payload.account_email),
            )
            self.repo.add_account(account)
        expires_at = (
            datetime.utcnow() + timedelta(seconds=payload.expires_in)
            if payload.expires_in
            else None
        )
        self.repo.update_account(
            account,
            access_token=payload.access_token or payload.code,
            refresh_token=payload.refresh_token,
            expires_at=expires_at,
            active=True,
        )
        self.db.commit()
        return CalendarAccountOut.model_validate(account)

    def sync_bookings(
        self, *, user_id: int, request: CalendarSyncRequest
    ) -> CalendarSyncResult:
        del user_id  # Bookings are global for now; multi-tenant filtering follows later.
        # For the MVP we simulate an "upsert" on the provider side by generating
        # synthetic IDs. This keeps the portal responsive without requiring live
        # provider credentials in development.
        bookings = self.repo.pending_bookings(request.provider, request.limit)
        created = 0
        updated = 0
        for booking in bookings:
            synthetic_id = self._build_event_id(request.provider, booking.id)
            self.repo.mark_booking_synced(booking, request.provider, synthetic_id)
            created += 1
        self.db.commit()
        return CalendarSyncResult(
            provider=request.provider,
            processed=len(bookings),
            created=created,
            updated=updated,
        )

    # Internal helpers ---------------------------------------------------------
    def _authorization_url(self, provider: str, state: str) -> str:
        if provider == "google":
            base = "https://accounts.google.com/o/oauth2/v2/auth"
            query = {
                "client_id": "rentguy-google-demo",
                "response_type": "code",
                "scope": "https://www.googleapis.com/auth/calendar.events",
                "redirect_uri": "https://rentguy.local/api/v1/calendars/oauth/callback",
                "access_type": "offline",
                "state": state,
            }
        else:
            base = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
            query = {
                "client_id": "rentguy-o365-demo",
                "response_type": "code",
                "scope": "https://graph.microsoft.com/Calendars.ReadWrite",
                "redirect_uri": "https://rentguy.local/api/v1/calendars/oauth/callback",
                "state": state,
            }
        return f"{base}?{urllib.parse.urlencode(query)}"

    def _build_event_id(self, provider: str, booking_id: int) -> str:
        return f"{provider}-{booking_id}-{secrets.token_hex(4)}"

