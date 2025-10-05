from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.modules.auth.deps import get_db, require_role
from .schemas import *
from .models import Category, Item, Bundle, BundleItem, MaintenanceLog
from .repo import InventoryRepo
from .usecases import InventoryService

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
        out.append(BundleOut(id=b.id, name=b.name, active=b.active, items=[BundleItemIn(item_id=i.item_id, quantity=i.quantity) for i in items]))
    return out

@router.post("/bundles", response_model=BundleOut)
def create_bundle(payload: BundleIn, items: list[BundleItemIn] = [], db: Session = Depends(get_db), user=Depends(require_role("admin","planner"))):
    repo = InventoryRepo(db)
    b = Bundle(**payload.model_dump()); repo.add_bundle(b)
    for it in items:
        repo.add_bundle_item(BundleItem(bundle_id=b.id, item_id=it.item_id, quantity=it.quantity))
    db.commit()
    return BundleOut(id=b.id, name=b.name, active=b.active, items=items)

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
