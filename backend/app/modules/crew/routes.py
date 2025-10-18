from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.modules.auth.deps import get_db, require_role
from .schemas import CrewMemberIn, CrewMemberOut, BookingIn, BookingOut
from .usecases import CrewService

router = APIRouter()

# Crew members
@router.get("/crew", response_model=list[CrewMemberOut])
def list_crew(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    return CrewService(db).list_members()

@router.post("/crew", response_model=CrewMemberOut)
def add_crew(payload: CrewMemberIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    return CrewService(db).create_member(payload)

# Bookings
@router.get("/me/bookings", response_model=list[BookingOut])
def my_bookings(
    crew_id: int | None = Query(default=None, description="Specifieke crew ID voor planners/admins"),
    db: Session = Depends(get_db),
    user=Depends(require_role("crew","planner","admin")),
):
    service = CrewService(db)
    try:
        return service.list_bookings_for_user(
            user_id=user.id, user_role=user.role, user_email=user.email, crew_id=crew_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.post("/bookings", response_model=BookingOut)
def create_booking(payload: BookingIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    return CrewService(db).create_booking(payload)

@router.post("/bookings/{booking_id}/accept", response_model=BookingOut)
def accept_booking(booking_id: int, db: Session = Depends(get_db), user=Depends(require_role("crew","planner","admin"))):
    service = CrewService(db)
    try:
        return service.update_booking_status(booking_id, "confirmed")
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@router.post("/bookings/{booking_id}/decline", response_model=BookingOut)
def decline_booking(booking_id: int, db: Session = Depends(get_db), user=Depends(require_role("crew","planner","admin"))):
    service = CrewService(db)
    try:
        return service.update_booking_status(booking_id, "declined")
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
