from sqlalchemy import Column, Integer, String, ForeignKey, Date, Boolean, Numeric, DateTime, func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.core.db import Base

class Category(Base):
    __tablename__ = "inv_categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)

class Item(Base):
    __tablename__ = "inv_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("inv_categories.id"))
    quantity_total: Mapped[int] = mapped_column(Integer, default=0)
    min_stock: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    price_per_day: Mapped[float] = mapped_column(Numeric(10,2), default=0)
    cost_per_day: Mapped[float] = mapped_column(Numeric(10,2), default=0)
    category = relationship("Category", lazy="joined")

class Bundle(Base):
    __tablename__ = "inv_bundles"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

class BundleItem(Base):
    __tablename__ = "inv_bundle_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    bundle_id: Mapped[int] = mapped_column(ForeignKey("inv_bundles.id"))
    item_id: Mapped[int] = mapped_column(ForeignKey("inv_items.id"))
    quantity: Mapped[int] = mapped_column(Integer, default=1)

class MaintenanceLog(Base):
    __tablename__ = "inv_maintenance_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("inv_items.id"))
    due_date = mapped_column(Date, nullable=True)
    done: Mapped[bool] = mapped_column(Boolean, default=False)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at = mapped_column(DateTime(timezone=True), server_default=func.now())
