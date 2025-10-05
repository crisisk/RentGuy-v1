from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import date
from typing import Optional

from .models import Project, ProjectItem
from app.modules.inventory.models import Item  # monolith read

def overlaps(a_start, a_end, b_start, b_end) -> bool:
    return not (a_end < b_start or b_end < a_start)

class ProjectsRepo:
    def __init__(self, db: Session):
        self.db = db

    # Projects
    def list(self) -> list[Project]:
        return self.db.execute(select(Project).order_by(Project.start_date.desc())).scalars().all()

    def get(self, project_id: int) -> Optional[Project]:
        return self.db.get(Project, project_id)

    def add(self, p: Project) -> Project:
        self.db.add(p); self.db.flush(); return p

    # Items of a project
    def list_items(self, project_id: int) -> list[ProjectItem]:
        return self.db.execute(select(ProjectItem).where(ProjectItem.project_id==project_id)).scalars().all()

    def add_item(self, pi: ProjectItem) -> ProjectItem:
        self.db.add(pi); self.db.flush(); return pi

    # Availability composition
    def reserved_qty_for_item(self, item_id: int, start: date, end: date, exclude_project_id: int | None = None) -> int:
        total = 0
        rows = self.db.execute(select(ProjectItem, Project).join(Project, ProjectItem.project_id==Project.id)).all()
        for pi, prj in rows:
            if pi.item_id != item_id:
                continue
            if exclude_project_id and prj.id == exclude_project_id:
                continue
            if overlaps(prj.start_date, prj.end_date, start, end):
                total += pi.qty_reserved
        return total

    def item_total(self, item_id: int) -> int:
        it = self.db.get(Item, item_id)
        return int(it.quantity_total) if it else 0
