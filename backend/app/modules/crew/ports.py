"""Public interfaces for the crew domain services."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Sequence

from .models import Booking, CrewMember
from .schemas import BookingIn, CrewMemberIn


class CrewServicePort(ABC):
    """Abstract service boundary that exposes crew operations to the API layer."""

    @abstractmethod
    def list_members(self) -> Sequence[CrewMember]:
        """Return all active crew members ordered by name."""

    @abstractmethod
    def create_member(self, payload: CrewMemberIn) -> CrewMember:
        """Persist a new crew member and return the stored record."""

    @abstractmethod
    def list_bookings_for_user(
        self,
        *,
        user_id: int,
        user_role: str,
        user_email: str,
        crew_id: int | None = None,
    ) -> Sequence[Booking]:
        """Return bookings visible for the requesting user.

        Crew users receive their own bookings automatically; planners/admins can
        optionally scope the query via ``crew_id``.
        """

    @abstractmethod
    def create_booking(self, payload: BookingIn) -> Booking:
        """Schedule a new booking and trigger notifications when possible."""

    @abstractmethod
    def update_booking_status(self, booking_id: int, status: str) -> Booking:
        """Change the booking status and return the refreshed entity."""

