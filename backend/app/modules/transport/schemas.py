from pydantic import BaseModel
from typing import List, Optional
from datetime import date, time, datetime

class VehicleIn(BaseModel):
    name: str
    plate: str
    capacity_kg: int = 0
    volume_m3: float = 0
    active: bool = True

class VehicleOut(VehicleIn):
    id: int
    class Config: from_attributes = True

class DriverIn(BaseModel):
    name: str
    phone: str
    email: str
    license_types: str = "B"
    active: bool = True

class DriverOut(DriverIn):
    id: int
    class Config: from_attributes = True

class RouteStopIn(BaseModel):
    sequence: int
    address: str
    contact_name: str
    contact_phone: str
    eta: datetime
    etd: datetime

class RouteIn(BaseModel):
    project_id: int
    vehicle_id: int
    driver_id: int
    date: date
    start_time: time
    end_time: time
    status: str = "planned"
    stops: List[RouteStopIn] = []

class RouteOut(BaseModel):
    id: int
    project_id: int
    vehicle_id: int
    driver_id: int
    date: date
    start_time: time
    end_time: time
    status: str
    class Config: from_attributes = True
