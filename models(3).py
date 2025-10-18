from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Boolean, Date, Time, DateTime, Numeric, ForeignKey, func
from app.core.db import Base

class Vehicle(Base):
    __tablename__ = "veh_vehicles"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    plate: Mapped[str] = mapped_column(String(40))
    capacity_kg: Mapped[int] = mapped_column(Integer, default=0)
    volume_m3: Mapped[float] = mapped_column(Numeric(10,2), default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

class Driver(Base):
    __tablename__ = "veh_drivers"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(60))
    email: Mapped[str] = mapped_column(String(200))
    license_types: Mapped[str] = mapped_column(String(120), default="B")
    active: Mapped[bool] = mapped_column(Boolean, default=True)

class Route(Base):
    __tablename__ = "veh_routes"
    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(Integer)  # prj_projects.id
    vehicle_id: Mapped[int] = mapped_column(Integer)  # veh_vehicles.id
    driver_id: Mapped[int] = mapped_column(Integer)   # veh_drivers.id
    date: Mapped[Date] = mapped_column(Date)
    start_time: Mapped[Time] = mapped_column(Time)
    end_time: Mapped[Time] = mapped_column(Time)
    status: Mapped[str] = mapped_column(String(20), default="planned")

class RouteStop(Base):
    __tablename__ = "veh_route_stops"
    id: Mapped[int] = mapped_column(primary_key=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("veh_routes.id"))
    sequence: Mapped[int] = mapped_column(Integer, default=1)
    address: Mapped[str] = mapped_column(String(250))
    contact_name: Mapped[str] = mapped_column(String(120))
    contact_phone: Mapped[str] = mapped_column(String(60))
    eta: Mapped[DateTime] = mapped_column(DateTime(timezone=True))
    etd: Mapped[DateTime] = mapped_column(DateTime(timezone=True))
