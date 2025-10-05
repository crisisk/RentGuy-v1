from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, DateTime, Date, Time, Boolean, ForeignKey, func
from app.core.db import Base

class CrewMember(Base):
    __tablename__ = "crew_members"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(120), default="crew")
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Booking(Base):
    __tablename__ = "crew_bookings"
    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(Integer)  # prj_projects.id
    crew_id: Mapped[int] = mapped_column(Integer)     # crew_members.id
    start: Mapped[DateTime] = mapped_column(DateTime(timezone=True))
    end: Mapped[DateTime] = mapped_column(DateTime(timezone=True))
    role: Mapped[str] = mapped_column(String(120), default="crew")
    status: Mapped[str] = mapped_column(String(20), default="tentative")  # tentative/confirmed/declined
    external_event_id_google: Mapped[str | None] = mapped_column(String(200), nullable=True)
    external_event_id_o365: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notify_email_sent_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
