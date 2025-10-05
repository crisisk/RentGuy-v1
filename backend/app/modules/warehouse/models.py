from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, DateTime, String, Boolean, ForeignKey, func
from app.core.db import Base

class InventoryMovement(Base):
    __tablename__ = "wh_movements"
    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(Integer)    # inv_items.id
    project_id: Mapped[int] = mapped_column(Integer) # prj_projects.id
    quantity: Mapped[int] = mapped_column(Integer)
    direction: Mapped[str] = mapped_column(String(10))  # out/in/adjust
    method: Mapped[str] = mapped_column(String(10))     # qr/manual
    by_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
