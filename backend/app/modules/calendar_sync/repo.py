"""Persistence helpers for calendar synchronisation."""
from __future__ import annotations

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.modules.crew.models import Booking, CrewMember

from .models import CalendarAccount


class CalendarSyncRepo:
    def __init__(self, db: Session) -> None:
        self.db = db

    # Calendar accounts -------------------------------------------------------
    def list_accounts(self, user_id: int | None = None) -> list[CalendarAccount]:
        stmt: Select[tuple[CalendarAccount]] = select(CalendarAccount).order_by(CalendarAccount.created_at.desc())
        if user_id is not None:
            stmt = stmt.where(CalendarAccount.user_id == user_id)
        return self.db.execute(stmt).scalars().all()

    def get_account(self, account_id: int) -> CalendarAccount | None:
        return self.db.get(CalendarAccount, account_id)

    def find_account(self, *, user_id: int, provider: str, account_email: str) -> CalendarAccount | None:
        stmt = select(CalendarAccount).where(
            CalendarAccount.user_id == user_id,
            CalendarAccount.provider == provider,
            CalendarAccount.account_email == account_email,
        )
        return self.db.execute(stmt).scalars().first()

    def add_account(self, account: CalendarAccount) -> CalendarAccount:
        self.db.add(account)
        self.db.flush()
        return account

    def update_account(self, account: CalendarAccount, **fields) -> CalendarAccount:
        for key, value in fields.items():
            setattr(account, key, value)
        self.db.add(account)
        self.db.flush()
        return account

    # Crew bookings -----------------------------------------------------------
    def pending_bookings(self, provider: str, limit: int) -> list[Booking]:
        field = (
            Booking.external_event_id_google
            if provider == "google"
            else Booking.external_event_id_o365
        )
        stmt: Select[tuple[Booking]] = (
            select(Booking)
            .where(field.is_(None))
            .order_by(Booking.start.asc())
            .limit(limit)
        )
        return self.db.execute(stmt).scalars().all()

    def crew_member_for_booking(self, booking: Booking) -> CrewMember | None:
        return self.db.get(CrewMember, booking.crew_id)

    def mark_booking_synced(self, booking: Booking, provider: str, external_id: str) -> None:
        if provider == "google":
            booking.external_event_id_google = external_id
        else:
            booking.external_event_id_o365 = external_id
        self.db.add(booking)

