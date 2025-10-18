"""Warehouse scanning and tagging services."""
from __future__ import annotations

from typing import Iterable, List

from sqlalchemy.orm import Session

from .models import InventoryMovement
from .ports import WarehouseServicePort
from .repo import WarehouseRepo
from .schemas import BundleItemOut, ScanIn, ScanResult, TagResolution, TagUpsertIn


class WarehouseError(RuntimeError):
    """Raised for domain validation problems within the warehouse module."""

    def __init__(
        self,
        message: str,
        *,
        code: str = "warehouse_error",
        status_code: int = 400,
        extra: dict | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.status_code = status_code
        self.extra = extra or {}


class WarehouseService(WarehouseServicePort):
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = WarehouseRepo(db)

    def resolve_tag(self, tag_value: str) -> TagResolution:
        resolution = self._build_resolution(tag_value)
        self.db.commit()
        return resolution

    def upsert_tag(self, payload: TagUpsertIn) -> TagResolution:
        if not payload.item_id and not payload.bundle_id:
            raise WarehouseError(
                "Koppel de tag aan een item of bundel",
                code="validation_error",
                status_code=422,
            )
        if payload.item_id and payload.bundle_id:
            raise WarehouseError(
                "Kies item of bundel, niet beide",
                code="validation_error",
                status_code=422,
            )
        self.repo.upsert_tag(
            tag_value=payload.tag_value,
            item_id=payload.item_id,
            bundle_id=payload.bundle_id,
        )
        resolution = self._build_resolution(payload.tag_value)
        self.db.commit()
        return resolution

    def register_scan(self, payload: ScanIn) -> ScanResult:
        resolution = self._build_resolution(payload.tag_value, touch=False)
        if resolution.kind == "unknown":
            raise WarehouseError(
                "Onbekende of gedeactiveerde tag",
                code="tag_not_found",
                status_code=404,
            )

        movements: List[InventoryMovement] = []
        if resolution.kind == "bundle":
            bundle_items = resolution.bundle_items
            if not bundle_items:
                raise WarehouseError(
                    "Bundel heeft geen onderliggende items",
                    code="bundle_empty",
                    status_code=409,
                )
            if payload.bundle_mode is None:
                raise WarehouseError(
                    "Selecteer of je de bundel wil uitklappen of als geheel wil boeken.",
                    code="bundle_mode_required",
                    status_code=409,
                    extra={"resolution": resolution.model_dump()},
                )
            movements.extend(
                self._book_bundle(payload, resolution.bundle_id, bundle_items)
                if payload.bundle_mode == "explode"
                else self._book_entire_bundle(payload, resolution.bundle_id)
            )
        else:
            movement = self.repo.add_movement(
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
            movements.append(movement)

        self.db.commit()
        resolution = self._build_resolution(payload.tag_value)
        return ScanResult(resolution=resolution, movements=movements)

    # Internal helpers ---------------------------------------------------------
    def _book_bundle(
        self,
        payload: ScanIn,
        bundle_id: int | None,
        components: Iterable[BundleItemOut],
    ) -> List[InventoryMovement]:
        if bundle_id is None:
            raise WarehouseError(
                "Bundel-ID ontbreekt",
                code="validation_error",
                status_code=422,
            )
        movements: List[InventoryMovement] = []
        for comp in components:
            movements.append(
                self.repo.add_movement(
                    InventoryMovement(
                        item_id=comp.item_id,
                        bundle_id=bundle_id,
                        project_id=payload.project_id,
                        quantity=comp.quantity * payload.qty,
                        direction=payload.direction,
                        method="qr",
                        by_user_id=None,
                        source_tag=payload.tag_value,
                    )
                )
            )
        return movements

    def _book_entire_bundle(self, payload: ScanIn, bundle_id: int | None) -> List[InventoryMovement]:
        if bundle_id is None:
            raise WarehouseError(
                "Bundel-ID ontbreekt",
                code="validation_error",
                status_code=422,
            )
        movement = self.repo.add_movement(
            InventoryMovement(
                item_id=None,
                bundle_id=bundle_id,
                project_id=payload.project_id,
                quantity=payload.qty,
                direction=payload.direction,
                method="qr",
                by_user_id=None,
                source_tag=payload.tag_value,
            )
        )
        return [movement]

    def _build_resolution(self, tag_value: str, *, touch: bool = True) -> TagResolution:
        tag = self.repo.get_tag(tag_value)
        if not tag or not tag.active:
            return TagResolution(tag_value=tag_value, kind="unknown")
        if touch:
            self.repo.touch_tag(tag)
        if tag.bundle_id:
            items = [
                BundleItemOut(item_id=i.item_id, quantity=i.quantity)
                for i in self.repo.list_bundle_items(tag.bundle_id)
            ]
            return TagResolution(
                tag_value=tag_value,
                kind="bundle",
                bundle_id=tag.bundle_id,
                bundle_items=items,
            )
        if tag.item_id:
            return TagResolution(tag_value=tag_value, kind="item", item_id=tag.item_id)
        return TagResolution(tag_value=tag_value, kind="unknown")

