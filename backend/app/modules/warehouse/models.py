from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, DateTime, String, Boolean, ForeignKey, func, CheckConstraint
from app.core.db import Base

class InventoryMovement(Base):
    __tablename__ = "wh_movements"
    __table_args__ = (
        CheckConstraint("item_id IS NOT NULL OR bundle_id IS NOT NULL", name="ck_wh_movements_subject"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int | None] = mapped_column(Integer, nullable=True)    # inv_items.id
    bundle_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("inv_bundles.id"), nullable=True)
    project_id: Mapped[int] = mapped_column(Integer) # prj_projects.id
    quantity: Mapped[int] = mapped_column(Integer)
    direction: Mapped[str] = mapped_column(String(10))  # out/in/adjust
    method: Mapped[str] = mapped_column(String(10))     # qr/manual
    by_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_tag: Mapped[str | None] = mapped_column(String(120), nullable=True)
    at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class ItemTag(Base):
    __tablename__ = "wh_item_tags"
    id: Mapped[int] = mapped_column(primary_key=True)
    tag_value: Mapped[str] = mapped_column(String(120), unique=True)
    item_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("inv_items.id"), nullable=True)
    bundle_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("inv_bundles.id"), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_seen_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
