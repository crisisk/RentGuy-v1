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


from sqlalchemy import Column, Integer, ForeignKey, DateTime, Float
from sqlalchemy.sql import func
from geoalchemy2 import Geometry

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("auth_users.id"), nullable=False, unique=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    # POINT geometry with SRID 4326 (WGS 84)
    geom = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    accuracy = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)
    project_id = Column(Integer, ForeignKey("prj_projects.id"), nullable=True)

    def __repr__(self):
        return f"<Location(user_id={self.user_id}, timestamp={self.timestamp})>"

