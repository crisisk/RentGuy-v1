from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.modules.auth.deps import get_db, require_role
from .models import Vehicle, Driver, Route, RouteStop
from .schemas import *
from .repo import TransportRepo
from .pdf import build_transport_pdf

router = APIRouter()

@router.get("/transport/vehicles", response_model=list[VehicleOut])
def list_vehicles(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    return TransportRepo(db).list_vehicles()

@router.post("/transport/vehicles", response_model=VehicleOut)
def create_vehicle(payload: VehicleIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    v = Vehicle(**payload.model_dump())
    TransportRepo(db).add_vehicle(v); db.commit(); return v

@router.get("/transport/drivers", response_model=list[DriverOut])
def list_drivers(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    return TransportRepo(db).list_drivers()

@router.post("/transport/drivers", response_model=DriverOut)
def create_driver(payload: DriverIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    d = Driver(**payload.model_dump())
    TransportRepo(db).add_driver(d); db.commit(); return d

@router.get("/transport/routes", response_model=list[RouteOut])
def list_routes(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    return TransportRepo(db).list_routes()

@router.post("/transport/routes", response_model=RouteOut)
def create_route(payload: RouteIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    repo = TransportRepo(db)
    r = Route(project_id=payload.project_id, vehicle_id=payload.vehicle_id, driver_id=payload.driver_id,
              date=payload.date, start_time=payload.start_time, end_time=payload.end_time, status=payload.status)
    repo.add_route(r)
    for st in payload.stops:
        repo.add_stop(RouteStop(route_id=r.id, **st.model_dump()))
    db.commit(); db.refresh(r)
    return r

@router.get("/transport/routes/{route_id}/pdf")
def route_pdf(route_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    repo = TransportRepo(db)
    r = repo.get_route(route_id)
    if not r: raise HTTPException(404, "Route not found")
    stops = repo.list_stops(route_id)
    from .models import Vehicle, Driver
    vehicle = db.get(Vehicle, r.vehicle_id)
    driver = db.get(Driver, r.driver_id)
    pdf = build_transport_pdf(r, stops, vehicle, driver)
    return Response(content=pdf, media_type="application/pdf")
