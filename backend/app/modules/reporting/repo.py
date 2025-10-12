from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Dict, Iterable, List

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.inventory.models import Item, MaintenanceLog
from app.modules.projects.models import Project, ProjectItem


class ReportingRepo:
    def __init__(self, db: Session) -> None:
        self.db = db

    def margin_rows(self) -> List[Dict[str, Any]]:
        stmt = (
            select(
                Project,
                func.coalesce(func.sum(ProjectItem.qty_reserved * func.coalesce(ProjectItem.price_override, Item.price_per_day)), 0).label("rate_sum"),
                func.coalesce(func.sum(ProjectItem.qty_reserved * Item.cost_per_day), 0).label("cost_sum"),
            )
            .join(ProjectItem, ProjectItem.project_id == Project.id, isouter=True)
            .join(Item, Item.id == ProjectItem.item_id, isouter=True)
            .group_by(Project.id)
        )
        rows: List[Dict[str, Any]] = []
        for project, rate_sum, cost_sum in self.db.execute(stmt).all():
            days = max((project.end_date - project.start_date).days + 1, 1)
            revenue = float(rate_sum or 0) * days
            cost = float(cost_sum or 0) * days
            margin = revenue - cost
            margin_pct = 0.0 if revenue == 0 else (margin / revenue) * 100.0
            rows.append(
                {
                    "project": project,
                    "revenue": round(revenue, 2),
                    "cost": round(cost, 2),
                    "margin": round(margin, 2),
                    "margin_pct": round(margin_pct, 2),
                }
            )
        return rows

    def maintenance_due_within(self, days: int = 14) -> Iterable[tuple[MaintenanceLog, Item | None]]:
        threshold = date.today() + timedelta(days=days)
        stmt = (
            select(MaintenanceLog, Item)
            .join(Item, Item.id == MaintenanceLog.item_id, isouter=True)
            .where(MaintenanceLog.done == False)
            .where(MaintenanceLog.due_date.isnot(None))
            .where(MaintenanceLog.due_date <= threshold)
        )
        return self.db.execute(stmt).all()

    def low_stock_items(self) -> Iterable[Item]:
        stmt = select(Item).where(Item.quantity_total <= Item.min_stock)
        return self.db.execute(stmt).scalars().all()

    def double_booking_candidates(self) -> List[Dict[str, Any]]:
        stmt = (
            select(
                ProjectItem.item_id,
                Item.name,
                Item.quantity_total,
                func.sum(ProjectItem.qty_reserved).label("reserved"),
            )
            .join(Item, Item.id == ProjectItem.item_id)
            .group_by(ProjectItem.item_id, Item.name, Item.quantity_total)
            .having(func.sum(ProjectItem.qty_reserved) > Item.quantity_total)
        )
        records: List[Dict[str, Any]] = []
        for item_id, name, quantity_total, reserved in self.db.execute(stmt).all():
            records.append(
                {
                    "item_id": item_id,
                    "name": name,
                    "reserved": int(reserved or 0),
                    "available": quantity_total,
                }
            )
        return records
