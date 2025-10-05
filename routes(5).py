from fastapi import APIRouter, Depends
from app.modules.auth.deps import require_role, get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/calendars/connect/{provider}")
def connect_calendar(provider: str, db: Session = Depends(get_db), user=Depends(require_role("admin","crew","planner"))):
    # Placeholder: real implementation redirects to OAuth
    return {"ok": True, "provider": provider, "message": "OAuth flow would start here."}

@router.post("/calendars/sync")
def sync_calendars(db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    # Placeholder: would poll and sync events
    return {"ok": True, "synced": 0}
