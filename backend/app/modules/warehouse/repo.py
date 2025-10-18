from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime
from .models import InventoryMovement, ItemTag
from app.modules.inventory.models import BundleItem

class WarehouseRepo:
    def __init__(self, db: Session):
        self.db = db

    # Movement persistence
    def add_movement(self, m: InventoryMovement) -> InventoryMovement:
        self.db.add(m); self.db.flush(); return m

    # Tag resolution
    def get_tag(self, tag_value: str) -> ItemTag | None:
        return self.db.execute(select(ItemTag).where(ItemTag.tag_value==tag_value)).scalar_one_or_none()

    def touch_tag(self, tag: ItemTag) -> None:
        tag.last_seen_at = datetime.utcnow()
        self.db.add(tag)

    def list_bundle_items(self, bundle_id: int) -> list[BundleItem]:
        return self.db.execute(select(BundleItem).where(BundleItem.bundle_id==bundle_id)).scalars().all()

    def upsert_tag(self, *, tag_value: str, item_id: int | None, bundle_id: int | None) -> ItemTag:
        tag = self.get_tag(tag_value)
        if tag is None:
            tag = ItemTag(tag_value=tag_value, item_id=item_id, bundle_id=bundle_id, active=True)
            self.db.add(tag)
        else:
            tag.item_id = item_id
            tag.bundle_id = bundle_id
            tag.active = True
            self.db.add(tag)
        self.db.flush()
        return tag
