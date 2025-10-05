from sqlalchemy.orm import Session
from sqlalchemy import select, update
from typing import List
from datetime import datetime
from .models import CrewMember, Booking

class CrewRepo:
    def __init__(self, db: Session):
        self.db = db

    # crew members
    def list_members(self) -> list[CrewMember]:
        return self.db.execute(select(CrewMember).order_by(CrewMember.name)).scalars().all()

    def add_member(self, c: CrewMember) -> CrewMember:
        self.db.add(c); self.db.flush(); return c

    # bookings
    def list_bookings_for_user(self, crew_id: int) -> list[Booking]:
        return self.db.execute(select(Booking).where(Booking.crew_id==crew_id).order_by(Booking.start.desc())).scalars().all()

    def add_booking(self, b: Booking) -> Booking:
        self.db.add(b); self.db.flush(); return b

    def get_booking(self, booking_id: int) -> Booking | None:
        return self.db.get(Booking, booking_id)

    def set_status(self, booking_id: int, status: str):
        self.db.execute(update(Booking).where(Booking.id==booking_id).values(status=status))
