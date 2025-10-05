from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from datetime import date, timedelta
from app.modules.auth.deps import get_db, require_role
from app.modules.inventory.models import Item, MaintenanceLog
from app.modules.projects.models import Project, ProjectItem

router = APIRouter()

@router.get("/reporting/summary")
def summary(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","finance","viewer"))):
    total_items = db.scalar(select(func.count(Item.id)))
    upcoming_maintenance = db.scalar(select(func.count(MaintenanceLog.id)).where(MaintenanceLog.done==False))
    active_projects = db.scalar(select(func.count(Project.id)).where(Project.end_date >= date.today()))
    return {"total_items": total_items or 0, "upcoming_maintenance": upcoming_maintenance or 0, "active_projects": active_projects or 0}

@router.get("/alerts/lowstock")
def low_stock(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse"))):
    rows = db.execute(select(Item).where(Item.quantity_total <= Item.min_stock)).scalars().all()
    return [{"item_id": i.id, "name": i.name, "qty": i.quantity_total, "min_stock": i.min_stock} for i in rows]

@router.get("/alerts/maintenance_due")
def maintenance_due(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse"))):
    rows = db.execute(select(MaintenanceLog).where(MaintenanceLog.done==False)).scalars().all()
    return [{"item_id": r.item_id, "due_date": str(r.due_date), "note": r.note} for r in rows]
