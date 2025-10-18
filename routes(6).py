from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.modules.auth.deps import get_db, require_role
from .schemas import CrewMemberIn, CrewMemberOut, BookingIn, BookingOut
from .models import CrewMember, Booking
from .repo import CrewRepo
from app.modules.platform.mailer import send_email, make_ics

router = APIRouter()

# Crew members
@router.get("/crew", response_model=list[CrewMemberOut])
def list_crew(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    return CrewRepo(db).list_members()

@router.post("/crew", response_model=CrewMemberOut)
def add_crew(payload: CrewMemberIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    c = CrewMember(**payload.model_dump())
    CrewRepo(db).add_member(c); db.commit()
    return c

# Bookings
@router.get("/me/bookings", response_model=list[BookingOut])
def my_bookings(db: Session = Depends(get_db), user=Depends(require_role("crew","planner","admin"))):
    # NOTE: in echte portal gebruik je auth user ↔ crew mapping; voor MVP simpel: require planner/admin met query param
    # Hier doen we een eenvoudige variant: als user.role=='crew', verwacht crew_id == user.id mapping (niet gereed in MVP).
    raise HTTPException(501, "Implement user->crew mapping for portal")

@router.post("/bookings", response_model=BookingOut)
def create_booking(payload: BookingIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    b = Booking(**payload.model_dump())
    CrewRepo(db).add_booking(b); db.commit()

    # Send notification email with ICS (best-effort)
    try:
        ics = make_ics(uid=str(uuid.uuid4()), dtstart=b.start, dtend=b.end,
                       summary=f"Boeking project {b.project_id} ({b.role})",
                       description=f"Je bent geboekt voor project {b.project_id} van {b.start} tot {b.end}")
        # Look up crew email (simple join emulation)
        member = db.get(CrewMember, b.crew_id)
        if member and member.email:
            send_email(member.email, "Nieuwe booking", "Je bent geboekt. Zie bijlage/portal.", ics)
    except Exception:
        pass

    return b

@router.post("/bookings/{booking_id}/accept", response_model=BookingOut)
def accept_booking(booking_id: int, db: Session = Depends(get_db), user=Depends(require_role("crew","planner","admin"))):
    repo = CrewRepo(db)
    b = repo.get_booking(booking_id)
    if not b: raise HTTPException(404, "Booking not found")
    repo.set_status(booking_id, "confirmed"); db.commit()
    b = repo.get_booking(booking_id)
    return b

@router.post("/bookings/{booking_id}/decline", response_model=BookingOut)
def decline_booking(booking_id: int, db: Session = Depends(get_db), user=Depends(require_role("crew","planner","admin"))):
    repo = CrewRepo(db)
    b = repo.get_booking(booking_id)
    if not b: raise HTTPException(404, "Booking not found")
    repo.set_status(booking_id, "declined"); db.commit()
    b = repo.get_booking(booking_id)
    return b
