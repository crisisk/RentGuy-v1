"""Transport module services."""
from __future__ import annotations

from typing import Sequence

from sqlalchemy.orm import Session

from .models import Driver, Route, RouteStop, Vehicle
from .ports import TransportServicePort
from .repo import TransportRepo
from .schemas import DriverIn, RouteIn, VehicleIn


class TransportService(TransportServicePort):
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = TransportRepo(db)

    def list_vehicles(self) -> Sequence[Vehicle]:
        return self.repo.list_vehicles()

    def create_vehicle(self, payload: VehicleIn) -> Vehicle:
        vehicle = Vehicle(**payload.model_dump())
        self.repo.add_vehicle(vehicle)
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def list_drivers(self) -> Sequence[Driver]:
        return self.repo.list_drivers()

    def create_driver(self, payload: DriverIn) -> Driver:
        driver = Driver(**payload.model_dump())
        self.repo.add_driver(driver)
        self.db.commit()
        self.db.refresh(driver)
        return driver

    def list_routes(self) -> Sequence[Route]:
        return self.repo.list_routes()

    def create_route(self, payload: RouteIn) -> Route:
        route = Route(
            project_id=payload.project_id,
            vehicle_id=payload.vehicle_id,
            driver_id=payload.driver_id,
            date=payload.date,
            start_time=payload.start_time,
            end_time=payload.end_time,
            status=payload.status,
        )
        self.repo.add_route(route)
        for stop in payload.stops:
            self.repo.add_stop(RouteStop(route_id=route.id, **stop.model_dump()))
        self.db.commit()
        self.db.refresh(route)
        return route

    def route_manifest(
        self, route_id: int
    ) -> tuple[Route, Sequence[RouteStop], Vehicle | None, Driver | None]:
        route = self.repo.get_route(route_id)
        if not route:
            raise ValueError("Route niet gevonden")
        stops = self.repo.list_stops(route_id)
        vehicle = self.db.get(Vehicle, route.vehicle_id)
        driver = self.db.get(Driver, route.driver_id)
        return route, stops, vehicle, driver

