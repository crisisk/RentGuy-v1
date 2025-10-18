from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.modules.auth.deps import get_db, require_role
from .schemas import ScanIn, MovementOut
from .models import InventoryMovement
from .repo import WarehouseRepo

router = APIRouter()

@router.post("/warehouse/scan", response_model=MovementOut)
def scan(payload: ScanIn, db: Session = Depends(get_db), user=Depends(require_role("admin","warehouse","planner"))):
    # MVP: map tag_value == item_id (in productie koppel aan ItemTag)
    try:
        item_id = int(payload.tag_value)
    except ValueError:
        raise HTTPException(400, "tag_value must be numeric item_id in MVP")
    m = InventoryMovement(item_id=item_id, project_id=payload.project_id, quantity=payload.qty, direction=payload.direction, method="qr", by_user_id=None)
    WarehouseRepo(db).add_movement(m); db.commit()
    return m
