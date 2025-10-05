from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List, Dict
from datetime import date

from .models import Item, Category, Bundle, BundleItem, MaintenanceLog

class InventoryRepo:
    def __init__(self, db: Session):
        self.db = db

    # Categories
    def list_categories(self) -> list[Category]:
        return self.db.execute(select(Category).order_by(Category.name)).scalars().all()

    def upsert_category(self, name: str) -> Category:
        c = self.db.execute(select(Category).where(Category.name==name)).scalar_one_or_none()
        if c: return c
        c = Category(name=name); self.db.add(c); self.db.flush(); return c

    # Items
    def list_items(self) -> list[Item]:
        return self.db.execute(select(Item).order_by(Item.name)).scalars().all()

    def get_item(self, item_id: int) -> Item | None:
        return self.db.get(Item, item_id)

    def add_item(self, item: Item) -> Item:
        self.db.add(item); self.db.flush(); return item

    def delete_item(self, item_id: int) -> bool:
        it = self.get_item(item_id)
        if not it: return False
        self.db.delete(it); return True

    # Bundles
    def list_bundles(self) -> list[Bundle]:
        return self.db.execute(select(Bundle).order_by(Bundle.name)).scalars().all()

    def get_bundle_items(self, bundle_id: int) -> list[BundleItem]:
        return self.db.execute(select(BundleItem).where(BundleItem.bundle_id==bundle_id)).scalars().all()

    def add_bundle(self, b: Bundle) -> Bundle:
        self.db.add(b); self.db.flush(); return b

    def add_bundle_item(self, bi: BundleItem) -> BundleItem:
        self.db.add(bi); self.db.flush(); return bi

    # Maintenance
    def log_maintenance(self, m: MaintenanceLog) -> MaintenanceLog:
        self.db.add(m); self.db.flush(); return m

    # Availability (simple placeholder; will subtract reservations once projects module exists)
    def calc_available(self, item_id: int, start: date, end: date) -> int:
        it = self.get_item(item_id)
        if not it: return 0
        # TODO: subtract overlapping reservations when projects module is active
        return it.quantity_total
