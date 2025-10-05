from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, DateTime, Boolean
from app.core.db import Base
from datetime import datetime

class CalendarAccount(Base):
    __tablename__ = "calendar_accounts"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer)  # link to auth_users.id or crew_members.id
    provider: Mapped[str] = mapped_column(String(20))  # 'google' or 'o365'
    account_email: Mapped[str] = mapped_column(String(200))
    access_token: Mapped[str | None] = mapped_column(String(200), nullable=True)
    refresh_token: Mapped[str | None] = mapped_column(String(200), nullable=True)
    expires_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
