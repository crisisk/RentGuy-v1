from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.modules.auth.deps import get_db, require_role
from .schemas import *
from .usecases import TransportService
from .pdf import build_transport_pdf

router = APIRouter()

@router.get("/transport/vehicles", response_model=list[VehicleOut])
def list_vehicles(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    return TransportService(db).list_vehicles()

@router.post("/transport/vehicles", response_model=VehicleOut)
def create_vehicle(payload: VehicleIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    return TransportService(db).create_vehicle(payload)

@router.get("/transport/drivers", response_model=list[DriverOut])
def list_drivers(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    return TransportService(db).list_drivers()

@router.post("/transport/drivers", response_model=DriverOut)
def create_driver(payload: DriverIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    return TransportService(db).create_driver(payload)

@router.get("/transport/routes", response_model=list[RouteOut])
def list_routes(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    return TransportService(db).list_routes()

@router.post("/transport/routes", response_model=RouteOut)
def create_route(payload: RouteIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    return TransportService(db).create_route(payload)

@router.get("/transport/routes/{route_id}/pdf")
def route_pdf(route_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    service = TransportService(db)
    try:
        route, stops, vehicle, driver = service.route_manifest(route_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    pdf = build_transport_pdf(route, stops, vehicle, driver)
    return Response(content=pdf, media_type="application/pdf")
