"""Inventory data access helpers."""

from __future__ import annotations

from datetime import date

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from .models import Bundle, BundleItem, Category, Item, MaintenanceLog
from app.modules.projects.models import Project, ProjectItem


class InventoryRepo:
    """High level repository responsible for inventory related persistence."""

    def __init__(self, db: Session):
        if db is None:  # pragma: no cover - defensive guard
            raise ValueError("A database session instance is required")
        self.db = db

    # ---- Categories ----
    def list_categories(self) -> list[Category]:
        """Return all inventory categories ordered alphabetically."""

        return (
            self.db.execute(select(Category).order_by(Category.name)).scalars().all()
        )

    def upsert_category(self, name: str) -> Category:
        """Return the category with *name*, creating it when it does not exist."""

        category = (
            self.db.execute(select(Category).where(Category.name == name)).scalar_one_or_none()
        )
        if category:
            return category

        category = Category(name=name)
        self.db.add(category)
        self.db.flush()
        return category

    # ---- Items ----
    def list_items(self) -> list[Item]:
        """Return all inventory items ordered alphabetically."""

        return self.db.execute(select(Item).order_by(Item.name)).scalars().all()

    def get_item(self, item_id: int) -> Item | None:
        """Retrieve an inventory item by identifier."""

        return self.db.get(Item, item_id)

    def get_item_by_id(self, item_id: int) -> Item | None:
        """Compatibility wrapper used by older route handlers."""

        return self.get_item(item_id)

    def add_item(self, item: Item) -> Item:
        """Persist *item* and ensure the primary key is populated."""

        self.db.add(item)
        self.db.flush()
        return item

    def delete_item(self, item_id: int, *, raise_if_missing: bool = False) -> bool:
        """Delete the item with *item_id*.

        When ``raise_if_missing`` is true a :class:`LookupError` is raised when the
        item does not exist. Otherwise ``False`` is returned in that situation.
        """

        item = self.get_item(item_id)
        if item is None:
            if raise_if_missing:
                raise LookupError(f"Item with id {item_id} was not found")
            return False

        self.db.delete(item)
        self.db.flush()
        return True

    # ---- Bundles ----
    def list_bundles(self) -> list[Bundle]:
        """Return all bundle definitions ordered alphabetically."""

        return self.db.execute(select(Bundle).order_by(Bundle.name)).scalars().all()

    def get_bundle_items(self, bundle_id: int) -> list[BundleItem]:
        """Return the bundle items belonging to *bundle_id*."""

        return (
            self.db.execute(select(BundleItem).where(BundleItem.bundle_id == bundle_id))
            .scalars()
            .all()
        )

    def add_bundle(self, bundle: Bundle) -> Bundle:
        """Persist a bundle definition."""

        self.db.add(bundle)
        self.db.flush()
        return bundle

    def add_bundle_item(self, bundle_item: BundleItem) -> BundleItem:
        """Persist a link between a bundle and an item."""

        self.db.add(bundle_item)
        self.db.flush()
        return bundle_item

    # ---- Maintenance ----
    def log_maintenance(self, log_entry: MaintenanceLog) -> MaintenanceLog:
        """Store a maintenance log entry."""

        self.db.add(log_entry)
        self.db.flush()
        return log_entry

    # ---- Availability ----
    def calc_available(self, item_id: int, start: date, end: date, *, strict: bool = False) -> int:
        """Return the number of available units for *item_id* in the given window.

        The current implementation only validates the time window and returns the
        total quantity on record. When ``strict`` is true a missing item results in a
        :class:`LookupError` instead of silently returning zero.
        """

        if start > end:
            raise ValueError("The start date must be before or equal to the end date")

        item = self.get_item(item_id)
        if item is None:
            if strict:
                raise LookupError(f"Item with id {item_id} was not found")
            return 0

        reserved_stmt = (
            select(func.coalesce(func.sum(ProjectItem.qty_reserved), 0))
            .join(Project, ProjectItem.project_id == Project.id)
            .where(
                ProjectItem.item_id == item_id,
                Project.start_date <= end,
                Project.end_date >= start,
            )
        )
        reserved = self.db.execute(reserved_stmt).scalar_one()

        available = int(item.quantity_total) - int(reserved or 0)
        return max(available, 0)
