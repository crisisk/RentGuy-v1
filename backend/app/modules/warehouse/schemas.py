from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

class ScanIn(BaseModel):
    tag_value: str
    direction: Literal["out","in"]
    project_id: int
    qty: int = 1
    bundle_mode: Literal["book_all", "explode"] | None = None

class MovementOut(BaseModel):
    id: int
    item_id: int | None
    bundle_id: int | None
    project_id: int
    quantity: int
    direction: str
    method: str
    source_tag: str | None

    model_config = ConfigDict(from_attributes=True)

class BundleItemOut(BaseModel):
    item_id: int
    quantity: int

class TagResolution(BaseModel):
    tag_value: str
    kind: Literal["item", "bundle", "unknown"]
    item_id: int | None = None
    bundle_id: int | None = None
    bundle_items: list[BundleItemOut] = Field(default_factory=list)

class ScanResult(BaseModel):
    resolution: TagResolution
    movements: list[MovementOut]


class TagUpsertIn(BaseModel):
    tag_value: str
    item_id: int | None = None
    bundle_id: int | None = None
