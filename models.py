from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, DateTime, Boolean, func
from app.core.db import Base

class OnboardingStep(Base):
    __tablename__ = "onb_steps"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(String(1000))

class UserProgress(Base):
    __tablename__ = "onb_progress"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_email: Mapped[str] = mapped_column(String(255), index=True)
    step_code: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending/complete
    completed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)

class Tip(Base):
    __tablename__ = "onb_tips"
    id: Mapped[int] = mapped_column(primary_key=True)
    module: Mapped[str] = mapped_column(String(50))    # inventory/projects/crew/...
    message: Mapped[str] = mapped_column(String(500))
    cta: Mapped[str] = mapped_column(String(200), default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
