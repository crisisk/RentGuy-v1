from sqlalchemy.orm import Session
from sqlalchemy import select
from .models import InventoryMovement

class WarehouseRepo:
    def __init__(self, db: Session):
        self.db = db
    def add_movement(self, m: InventoryMovement) -> InventoryMovement:
        self.db.add(m); self.db.flush(); return m
