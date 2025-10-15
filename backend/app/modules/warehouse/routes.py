from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.modules.auth.deps import get_db, require_role
from .schemas import ScanIn, TagResolution, ScanResult, TagUpsertIn
from .usecases import WarehouseError, WarehouseService


router = APIRouter()

@router.get("/warehouse/tags/{tag_value}", response_model=TagResolution)
def resolve_tag(tag_value: str, db: Session = Depends(get_db), user=Depends(require_role("admin","warehouse","planner","viewer"))):
    service = WarehouseService(db)
    return service.resolve_tag(tag_value)


@router.post("/warehouse/tags", response_model=TagResolution, status_code=status.HTTP_201_CREATED)
def upsert_tag(payload: TagUpsertIn, db: Session = Depends(get_db), user=Depends(require_role("admin","warehouse"))):
    service = WarehouseService(db)
    try:
        return service.upsert_tag(payload)
    except WarehouseError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc), **exc.extra}) from exc


@router.post("/warehouse/scan", response_model=ScanResult)
def scan(payload: ScanIn, db: Session = Depends(get_db), user=Depends(require_role("admin","warehouse","planner"))):
    service = WarehouseService(db)
    try:
        return service.register_scan(payload)
    except WarehouseError as exc:
        detail: dict[str, object] = {"code": exc.code, "message": str(exc)}
        if exc.extra:
            detail.update(exc.extra)
        raise HTTPException(status_code=exc.status_code, detail=detail) from exc
