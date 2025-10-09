from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

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

    def add(self, project: Project) -> Project:
        self.db.add(project)
        self.db.flush()
        return project

    # Items of a project
    def list_items(self, project_id: int) -> list[ProjectItem]:
        return (
            self.db.execute(select(ProjectItem).where(ProjectItem.project_id == project_id))
            .scalars()
            .all()
        )

    def add_item(self, project_item: ProjectItem) -> ProjectItem:
        self.db.add(project_item)
        self.db.flush()
        return project_item

    # Availability composition
    def reserved_qty_for_item(
        self, item_id: int, start: date, end: date, exclude_project_id: int | None = None
    ) -> int:
        total = 0
        rows = self.db.execute(select(ProjectItem, Project).join(Project, ProjectItem.project_id == Project.id)).all()
        for project_item, project in rows:
            if project_item.item_id != item_id:
                continue
            if exclude_project_id and project.id == exclude_project_id:
                continue
            if overlaps(project.start_date, project.end_date, start, end):
                total += project_item.qty_reserved
        return total

    def item_total(self, item_id: int) -> int:
        item = self.db.get(Item, item_id)
        return int(item.quantity_total) if item else 0
