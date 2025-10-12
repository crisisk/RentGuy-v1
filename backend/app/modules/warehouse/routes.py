from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.modules.auth.deps import get_db, require_role
from .schemas import ScanIn, MovementOut, TagResolution, ScanResult, BundleItemOut, TagUpsertIn
from .models import InventoryMovement
from .repo import WarehouseRepo


def _build_resolution(repo: WarehouseRepo, tag_value: str) -> TagResolution:
    tag = repo.get_tag(tag_value)
    if not tag or not tag.active:
        return TagResolution(tag_value=tag_value, kind="unknown")
    repo.touch_tag(tag)
    if tag.bundle_id:
        items = [BundleItemOut(item_id=i.item_id, quantity=i.quantity) for i in repo.list_bundle_items(tag.bundle_id)]
        return TagResolution(tag_value=tag_value, kind="bundle", bundle_id=tag.bundle_id, bundle_items=items)
    if tag.item_id:
        return TagResolution(tag_value=tag_value, kind="item", item_id=tag.item_id)
    return TagResolution(tag_value=tag_value, kind="unknown")

router = APIRouter()

@router.get("/warehouse/tags/{tag_value}", response_model=TagResolution)
def resolve_tag(tag_value: str, db: Session = Depends(get_db), user=Depends(require_role("admin","warehouse","planner","viewer"))):
    repo = WarehouseRepo(db)
    resolution = _build_resolution(repo, tag_value)
    db.commit()
    return resolution


@router.post("/warehouse/tags", response_model=TagResolution, status_code=status.HTTP_201_CREATED)
def upsert_tag(payload: TagUpsertIn, db: Session = Depends(get_db), user=Depends(require_role("admin","warehouse"))):
    if not payload.item_id and not payload.bundle_id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Koppel de tag aan een item of bundel")
    if payload.item_id and payload.bundle_id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Kies item of bundel, niet beide")
    repo = WarehouseRepo(db)
    repo.upsert_tag(tag_value=payload.tag_value, item_id=payload.item_id, bundle_id=payload.bundle_id)
    resolution = _build_resolution(repo, payload.tag_value)
    db.commit()
    return resolution


@router.post("/warehouse/scan", response_model=ScanResult)
def scan(payload: ScanIn, db: Session = Depends(get_db), user=Depends(require_role("admin","warehouse","planner"))):
    repo = WarehouseRepo(db)
    tag = repo.get_tag(payload.tag_value)
    if not tag or not tag.active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onbekende of gedeactiveerde tag")

    resolution = _build_resolution(repo, payload.tag_value)
    if resolution.kind == "unknown":
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Tag mist item- of bundel koppeling")

    movements: list[InventoryMovement] = []
    if resolution.kind == "bundle":
        bundle_items = resolution.bundle_items
        if not bundle_items:
            raise HTTPException(status.HTTP_409_CONFLICT, "Bundel heeft geen onderliggende items")
        if payload.bundle_mode is None:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                {
                    "code": "bundle_mode_required",
                    "message": "Selecteer of je de bundel wil uitklappen of als geheel wil boeken.",
                    "resolution": resolution.model_dump(),
                },
            )
        if payload.bundle_mode == "explode":
            for comp in bundle_items:
                movements.append(
                    repo.add_movement(
                        InventoryMovement(
                            item_id=comp.item_id,
                            bundle_id=resolution.bundle_id,
                            project_id=payload.project_id,
                            quantity=comp.quantity * payload.qty,
                            direction=payload.direction,
                            method="qr",
                            by_user_id=None,
                            source_tag=payload.tag_value,
                        )
                    )
                )
        else:  # book_all
            movements.append(
                repo.add_movement(
                    InventoryMovement(
                        item_id=None,
                        bundle_id=resolution.bundle_id,
                        project_id=payload.project_id,
                        quantity=payload.qty,
                        direction=payload.direction,
                        method="qr",
                        by_user_id=None,
                        source_tag=payload.tag_value,
                    )
                )
            )
    else:  # item resolution
        movements.append(
            repo.add_movement(
                InventoryMovement(
                    item_id=resolution.item_id,
                    bundle_id=None,
                    project_id=payload.project_id,
                    quantity=payload.qty,
                    direction=payload.direction,
                    method="qr",
                    by_user_id=None,
                    source_tag=payload.tag_value,
                )
            )
        )

    db.commit()
    return ScanResult(resolution=resolution, movements=movements)
