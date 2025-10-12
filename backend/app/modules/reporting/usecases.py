from __future__ import annotations

from typing import List

from .repo import ReportingRepo
from .schemas import AlertOut, MarginRow


class ReportingService:
    def __init__(self, repo: ReportingRepo) -> None:
        self.repo = repo

    def margins(self) -> List[MarginRow]:
        rows = []
        for entry in self.repo.margin_rows():
            project = entry["project"]
            rows.append(
                MarginRow(
                    project_id=project.id,
                    project_name=project.name,
                    client_name=project.client_name,
                    revenue=entry["revenue"],
                    cost=entry["cost"],
                    margin=entry["margin"],
                    margin_percentage=entry["margin_pct"],
                )
            )
        return rows

    def expiring_maintenance_alerts(self) -> List[AlertOut]:
        alerts: List[AlertOut] = []
        for log, item in self.repo.maintenance_due_within():
            alerts.append(
                AlertOut(
                    type="maintenance",
                    severity="critical",
                    message=f"Onderhoud voor item {log.item_id} vervalt op {log.due_date}",
                    metadata={
                        "item_id": log.item_id,
                        "item_name": getattr(item, "name", None),
                        "due_date": str(log.due_date),
                        "note": log.note,
                    },
                )
            )
        return alerts

    def low_stock_alerts(self) -> List[AlertOut]:
        alerts: List[AlertOut] = []
        for item in self.repo.low_stock_items():
            alerts.append(
                AlertOut(
                    type="low_stock",
                    severity="warning",
                    message=f"Voorraad item {item.name} ({item.id}) onder minimum",
                    metadata={
                        "item_id": item.id,
                        "name": item.name,
                        "quantity_total": item.quantity_total,
                        "min_stock": item.min_stock,
                    },
                )
            )
        return alerts

    def double_booking_alerts(self) -> List[AlertOut]:
        alerts: List[AlertOut] = []
        for record in self.repo.double_booking_candidates():
            alerts.append(
                AlertOut(
                    type="double_booking",
                    severity="critical",
                    message=f"Item {record['name']} heeft {record['reserved']} reserveringen op {record['available']} capaciteit",
                    metadata=record,
                )
            )
        return alerts

    def alert_summary(self) -> List[AlertOut]:
        alerts = []
        alerts.extend(self.expiring_maintenance_alerts())
        alerts.extend(self.double_booking_alerts())
        alerts.extend(self.low_stock_alerts())
        return alerts
