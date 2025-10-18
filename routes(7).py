from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.modules.auth.deps import get_db, require_role
from .schemas import ProjectIn, ProjectOut, ProjectDetail, ReserveRequest, ProjectItemOut
from .models import Project
from .repo import ProjectsRepo
from .usecases import ReservationService

router = APIRouter()

@router.get("/projects", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    return ProjectsRepo(db).list()

@router.post("/projects", response_model=ProjectOut)
def create_project(payload: ProjectIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    p = Project(**payload.model_dump())
    ProjectsRepo(db).add(p); db.commit()
    return p

@router.get("/projects/{project_id}", response_model=ProjectDetail)
def get_project(project_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    repo = ProjectsRepo(db)
    p = repo.get(project_id)
    if not p: raise HTTPException(404, "Project not found")
    items = [ProjectItemOut(id=i.id, project_id=i.project_id, item_id=i.item_id, qty_reserved=i.qty_reserved) for i in repo.list_items(project_id)]
    return ProjectDetail(project=p, items=items)

@router.post("/projects/{project_id}/reserve", response_model=list[ProjectItemOut])
def reserve_items(project_id: int, payload: ReserveRequest, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
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

from datetime import date
from .repo import ProjectsRepo
from .usecases import ReservationService
from .models import ProjectItem

class ProjectDatesIn(ProjectIn):
    start_date: date
    end_date: date

@router.put("/projects/{project_id}/dates", response_model=ProjectOut)
def update_project_dates(project_id: int, payload: ProjectDatesIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
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
    prj.start_date = payload.start_date
    prj.end_date = payload.end_date
    db.commit()
    db.refresh(prj)
    return prj
