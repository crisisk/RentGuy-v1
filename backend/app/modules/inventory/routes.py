from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.modules.auth.deps import get_db, require_role
from .schemas import (
    AvailabilityRequest,
    AvailabilityResponse,
    BundleCreate,
    BundleItemOut,
    BundleOut,
    CategoryIn,
    CategoryOut,
    ItemIn,
    ItemOut,
    ItemStatusUpdate,
    MaintenanceLogIn,
    MaintenanceLogOut,
)
from .models import Category, Item, Bundle, BundleItem, MaintenanceLog
from .repo import InventoryRepo
from .usecases import InventoryService
from datetime import datetime

router = APIRouter()

# ---- Categories ----
@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    return InventoryRepo(db).list_categories()

@router.post("/categories", response_model=CategoryOut)
def create_category(payload: CategoryIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    c = InventoryRepo(db).upsert_category(payload.name)
    db.commit()
    return c

# ---- Items ----
@router.get("/items", response_model=list[ItemOut])
def list_items(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    return InventoryRepo(db).list_items()

@router.post("/items", response_model=ItemOut)
def create_item(payload: ItemIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse"))):
    it = Item(**payload.model_dump())
    InventoryRepo(db).add_item(it); db.commit()
    return it

@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    ok = InventoryRepo(db).delete_item(item_id)
    if not ok: raise HTTPException(404, "Item not found")
    db.commit()
    return {"ok": True}

# ---- Bundles ----
@router.get("/bundles", response_model=list[BundleOut])
def list_bundles(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    repo = InventoryRepo(db)
    out: list[BundleOut] = []
    for b in repo.list_bundles():
        items = repo.get_bundle_items(b.id)
        out.append(
            BundleOut(
                id=b.id,
                name=b.name,
                active=b.active,
                items=[BundleItemOut(item_id=i.item_id, quantity=i.quantity) for i in items],
            )
        )
    return out

@router.post("/bundles", response_model=BundleOut)
def create_bundle(payload: BundleCreate, db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    repo = InventoryRepo(db)
    bundle_data = payload.model_dump(exclude={"items"})
    b = Bundle(**bundle_data)
    repo.add_bundle(b)
    stored_items: list[BundleItemOut] = []
    for definition in payload.items:
        link = repo.add_bundle_item(
            BundleItem(
                bundle_id=b.id,
                item_id=definition.item_id,
                quantity=definition.quantity,
            )
        )
        stored_items.append(BundleItemOut(item_id=link.item_id, quantity=link.quantity))
    db.commit()
    return BundleOut(id=b.id, name=b.name, active=b.active, items=stored_items)

# ---- Maintenance ----
@router.post("/maintenance", response_model=MaintenanceLogOut)
def log_maintenance(payload: MaintenanceLogIn, db: Session = Depends(get_db), user=Depends(require_role("admin","warehouse","planner"))):
    m = MaintenanceLog(**payload.model_dump())
    InventoryRepo(db).log_maintenance(m); db.commit()
    return m

# ---- Availability ----
@router.post("/availability", response_model=list[AvailabilityResponse])
def check_availability(requests: list[AvailabilityRequest], db: Session = Depends(get_db), user=Depends(require_role("admin","planner","warehouse","viewer"))):
    svc = InventoryService(db)
    return svc.check_availability(requests)

# ---- Real-time Equipment Status Update ----
@router.patch("/items/{item_id}/status", response_model=ItemOut)
async def update_item_status(
    item_id: int,
    payload: ItemStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin", "warehouse", "crew"))
):
    repo = InventoryRepo(db)
    item = repo.get_item_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Update the status
    item.status = payload.status
    db.commit()

    # Broadcast the update via WebSocket when a server is available
    sio = getattr(request.app.state, "sio", None)
    if sio is not None:
        await sio.emit(
            "equipment_status_update",
            {
                "item_id": item.id,
                "status": item.status,
                "timestamp": datetime.now().isoformat(),
            },
        )

    return item

