from sqlalchemy.orm import Session
from typing import List
from datetime import date

from .repo import ProjectsRepo
from .models import ProjectItem
from .schemas import ReserveItemIn

class ReservationService:
    def __init__(self, db: Session):
        self.repo = ProjectsRepo(db)

    def check_items_available(self, start: date, end: date, items: List[ReserveItemIn], exclude_project_id: int | None = None) -> list[dict]:
        result: list[dict] = []
        for r in items:
            total = self.repo.item_total(r.item_id)
            reserved = self.repo.reserved_qty_for_item(r.item_id, start, end, exclude_project_id)
            available = max(total - reserved, 0)
            result.append({"item_id": r.item_id, "requested": r.qty, "available": available, "ok": available >= r.qty})
        return result

    def reserve_items(self, project_id: int, items: List[ReserveItemIn]) -> List[ProjectItem]:
        prj = self.repo.get(project_id)
        if not prj:
            raise ValueError("Project not found")
        checks = self.check_items_available(prj.start_date, prj.end_date, items, exclude_project_id=project_id)
        not_ok = [c for c in checks if not c["ok"]]
        if not_ok:
            raise RuntimeError({"error": "insufficient_stock", "details": not_ok})
        out: list[ProjectItem] = []
        for r in items:
            pi = ProjectItem(project_id=project_id, item_id=r.item_id, qty_reserved=r.qty)
            self.repo.add_item(pi); out.append(pi)
        return out
