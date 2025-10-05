from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Date, Integer, Numeric, DateTime, func, ForeignKey
from app.core.db import Base

class Project(Base):
    __tablename__ = "prj_projects"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    client_name: Mapped[str] = mapped_column(String(200))
    start_date: Mapped[Date] = mapped_column(Date)
    end_date: Mapped[Date] = mapped_column(Date)
    notes: Mapped[str] = mapped_column(String(1000), default="")
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class ProjectItem(Base):
    __tablename__ = "prj_project_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("prj_projects.id"))
    item_id: Mapped[int] = mapped_column(Integer)  # inv_items.id
    qty_reserved: Mapped[int] = mapped_column(Integer)
    price_override: Mapped[Numeric | None] = mapped_column(Numeric(10,2), nullable=True)
