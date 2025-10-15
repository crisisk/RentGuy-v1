"""Business logic for crew and booking operations."""
from __future__ import annotations

import uuid
from typing import Sequence

from sqlalchemy.orm import Session

from app.modules.platform.mailer import make_ics, send_email

from .models import Booking, CrewMember
from .ports import CrewServicePort
from .repo import CrewRepo
from .schemas import BookingIn, CrewMemberIn


class CrewService(CrewServicePort):
    """Concrete implementation of :class:`CrewServicePort`."""

    def __init__(self, db: Session, *, mail_sender=send_email, ics_builder=make_ics) -> None:
        self.db = db
        self.repo = CrewRepo(db)
        self._send_mail = mail_sender
        self._make_ics = ics_builder

    # Crew members -----------------------------------------------------------------
    def list_members(self) -> Sequence[CrewMember]:
        return self.repo.list_members()

    def create_member(self, payload: CrewMemberIn) -> CrewMember:
        member = CrewMember(**payload.model_dump())
        self.repo.add_member(member)
        self.db.commit()
        self.db.refresh(member)
        return member

    # Bookings ---------------------------------------------------------------------
    def list_bookings_for_user(
        self,
        *,
        user_id: int,
        user_role: str,
        user_email: str,
        crew_id: int | None = None,
    ) -> Sequence[Booking]:
        if crew_id is None:
            if user_role == "crew":
                member = self.repo.find_member_by_email(user_email)
                if not member:
                    raise ValueError("Geen crew-profiel gevonden voor deze gebruiker")
                crew_id = member.id
            elif user_role in {"planner", "admin"}:
                raise ValueError("Geef een crew_id op om boekingen te bekijken")
            else:
                raise ValueError("Rol heeft geen toegang tot crew boekingen")
        return self.repo.list_bookings_for_user(crew_id)

    def create_booking(self, payload: BookingIn) -> Booking:
        booking = Booking(**payload.model_dump())
        self.repo.add_booking(booking)
        self.db.commit()
        self.db.refresh(booking)
        self._notify_booking(booking)
        return booking

    def update_booking_status(self, booking_id: int, status: str) -> Booking:
        booking = self.repo.get_booking(booking_id)
        if not booking:
            raise ValueError("Booking niet gevonden")
        self.repo.set_status(booking_id, status)
        self.db.commit()
        self.db.refresh(booking)
        return booking

    # Internal helpers -------------------------------------------------------------
    def _notify_booking(self, booking: Booking) -> None:
        member = self.db.get(CrewMember, booking.crew_id)
        if not member or not member.email:
            return
        try:
            ics = self._make_ics(
                uid=str(uuid.uuid4()),
                dtstart=booking.start,
                dtend=booking.end,
                summary=f"Boeking project {booking.project_id} ({booking.role})",
                description=(
                    f"Je bent geboekt voor project {booking.project_id} van"
                    f" {booking.start} tot {booking.end}"
                ),
            )
            self._send_mail(
                member.email,
                "Nieuwe booking",
                "Je bent geboekt. Zie bijlage of portal voor details.",
                ics,
            )
        except Exception:
            # Mailing is best-effort; we deliberately swallow errors to avoid
            # masking the successful booking creation.
            pass

