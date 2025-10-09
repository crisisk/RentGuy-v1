from __future__ import annotations

from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.modules.auth.deps import get_db, require_role
from app.modules.inventory.models import Item
from .models import Project
from .repo import ProjectsRepo
from .schemas import ProjectDetail, ProjectIn, ProjectItemOut, ProjectOut, ReserveRequest
from .usecases import ReservationService

router = APIRouter()

def _project_schedule_metadata(project: Project) -> tuple[str, int | None, int | None]:
    today = date.today()
    duration = (project.end_date - project.start_date).days + 1
    if project.end_date < today:
        return "completed", None, duration
    if project.start_date > today:
        return "upcoming", (project.start_date - today).days, duration
    return "active", 0, duration


def _inventory_health(repo: ProjectsRepo, project: Project) -> tuple[str, list[str]]:
    risk = "ok"
    alerts: list[str] = []
    item_rows = repo.list_items(project.id)
    for item_row in item_rows:
        item = repo.db.get(Item, item_row.item_id)
        total_qty = int(item.quantity_total) if item and item.quantity_total is not None else 0
        if total_qty == 0:
            risk = "critical"
            label = item.name if item and getattr(item, "name", None) else f"Item #{item_row.item_id}"
            alerts.append(f"Geen voorraad geregistreerd voor {label}.")
            continue
        ratio = item_row.qty_reserved / total_qty
        label = item.name if item and getattr(item, "name", None) else f"Item #{item_row.item_id}"
        percentage = round(ratio * 100)
        if ratio >= 1:
            risk = "critical"
            alerts.append(f"{label}: alle {total_qty} stuks zijn gereserveerd.")
        elif ratio >= 0.75:
            if risk == "ok":
                risk = "warning"
            alerts.append(f"{label}: {percentage}% van de voorraad is gepland.")
    return risk, alerts


def _serialize_project(repo: ProjectsRepo, project: Project) -> ProjectOut:
    status, days_until_start, duration = _project_schedule_metadata(project)
    inventory_risk, alerts = _inventory_health(repo, project)
    derived_status = "at_risk" if status != "completed" and inventory_risk == "critical" else status
    return ProjectOut(
        id=project.id,
        name=project.name,
        client_name=project.client_name,
        start_date=project.start_date,
        end_date=project.end_date,
        notes=project.notes,
        status=derived_status,
        days_until_start=days_until_start,
        duration_days=duration,
        inventory_risk=inventory_risk,
        inventory_alerts=alerts,
    )


@router.get("/projects", response_model=list[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    user=Depends(require_role("admin", "planner", "warehouse", "viewer")),
):
    repo = ProjectsRepo(db)
    return [_serialize_project(repo, project) for project in repo.list()]

@router.post("/projects", response_model=ProjectOut)
def create_project(payload: ProjectIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    repo = ProjectsRepo(db)
    project = Project(**payload.model_dump())
    repo.add(project)
    db.commit()
    db.refresh(project)
    return _serialize_project(repo, project)

@router.get("/projects/{project_id}", response_model=ProjectDetail)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin", "planner", "warehouse", "viewer")),
):
    repo = ProjectsRepo(db)
    project = repo.get(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    items = [
        ProjectItemOut(id=i.id, project_id=i.project_id, item_id=i.item_id, qty_reserved=i.qty_reserved)
        for i in repo.list_items(project_id)
    ]
    return ProjectDetail(project=_serialize_project(repo, project), items=items)

@router.post("/projects/{project_id}/reserve", response_model=list[ProjectItemOut])
def reserve_items(
    project_id: int,
    payload: ReserveRequest,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin", "planner")),
):
    svc = ReservationService(db)
    try:
        pis = svc.reserve_items(project_id, payload.items)
    except ValueError:
        raise HTTPException(404, "Project not found")
    except RuntimeError as e:
        detail = e.args[0] if e.args else {"error": "insufficient_stock"}
        raise HTTPException(409, detail)
    db.commit()
    return [ProjectItemOut(id=i.id, project_id=i.project_id, item_id=i.item_id, qty_reserved=i.qty_reserved) for i in pis]

class ProjectDatesIn(ProjectIn):
    start_date: date
    end_date: date

@router.put("/projects/{project_id}/dates", response_model=ProjectOut)
def update_project_dates(
    project_id: int,
    payload: ProjectDatesIn,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin", "planner")),
):
    repo = ProjectsRepo(db)
    prj = repo.get(project_id)
    if not prj:
        raise HTTPException(404, "Project not found")
    # Check availability for all reserved items on new dates
    svc = ReservationService(db)
    items = repo.list_items(project_id)
    reqs = [{"item_id": i.item_id, "qty": i.qty_reserved} for i in items]
    # Convert to ReserveItemIn objects
    from .schemas import ReserveItemIn
    req_models = [ReserveItemIn(item_id=x["item_id"], qty=x["qty"]) for x in reqs]
    checks = svc.check_items_available(payload.start_date, payload.end_date, req_models, exclude_project_id=project_id)
    not_ok = [c for c in checks if not c["ok"]]
    if not_ok:
        raise HTTPException(409, {"error": "insufficient_stock_on_move", "details": not_ok})
    # Safe to update
    prj.name = payload.name
    prj.client_name = payload.client_name
    prj.start_date = payload.start_date
    prj.end_date = payload.end_date
    prj.notes = payload.notes
    db.commit()
    db.refresh(prj)
    return _serialize_project(repo, prj)
