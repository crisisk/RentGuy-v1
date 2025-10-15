"""Public service interfaces for the transport module."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Sequence

from .models import Driver, Route, RouteStop, Vehicle
from .schemas import DriverIn, RouteIn, VehicleIn


class TransportServicePort(ABC):
    @abstractmethod
    def list_vehicles(self) -> Sequence[Vehicle]:
        """Return all registered vehicles ordered by name."""

    @abstractmethod
    def create_vehicle(self, payload: VehicleIn) -> Vehicle:
        """Store a new vehicle and return the persisted entity."""

    @abstractmethod
    def list_drivers(self) -> Sequence[Driver]:
        """Return all drivers ordered by name."""

    @abstractmethod
    def create_driver(self, payload: DriverIn) -> Driver:
        """Persist a new driver record."""

    @abstractmethod
    def list_routes(self) -> Sequence[Route]:
        """Return planned routes ordered by date descending."""

    @abstractmethod
    def create_route(self, payload: RouteIn) -> Route:
        """Create a new route including stops and return the stored route."""

    @abstractmethod
    def route_manifest(self, route_id: int) -> tuple[Route, Sequence[RouteStop], Vehicle | None, Driver | None]:
        """Return the route with associated stops and linked resources."""

