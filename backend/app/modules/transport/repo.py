from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from .models import Vehicle, Driver, Route, RouteStop

class TransportRepo:
    def __init__(self, db: Session):
        self.db = db

    # Vehicles
    def list_vehicles(self) -> list[Vehicle]:
        return self.db.execute(select(Vehicle).order_by(Vehicle.name)).scalars().all()
    def add_vehicle(self, v: Vehicle) -> Vehicle:
        self.db.add(v); self.db.flush(); return v

    # Drivers
    def list_drivers(self) -> list[Driver]:
        return self.db.execute(select(Driver).order_by(Driver.name)).scalars().all()
    def add_driver(self, d: Driver) -> Driver:
        self.db.add(d); self.db.flush(); return d

    # Routes
    def list_routes(self) -> list[Route]:
        return self.db.execute(select(Route).order_by(Route.date.desc())).scalars().all()
    def add_route(self, r: Route) -> Route:
        self.db.add(r); self.db.flush(); return r
    def add_stop(self, s: RouteStop) -> RouteStop:
        self.db.add(s); self.db.flush(); return s
    def get_route(self, rid: int) -> Route | None:
        return self.db.get(Route, rid)
    def list_stops(self, rid: int) -> list[RouteStop]:
        return self.db.execute(select(RouteStop).where(RouteStop.route_id==rid).order_by(RouteStop.sequence)).scalars().all()
