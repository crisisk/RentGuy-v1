"""SQLAlchemy models for the recurring invoices module."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.db import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.modules.auth.models import User


class RecurringInvoiceStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


class RecurringInvoice(Base):
    """Definition of a scheduled recurring invoice."""

    __tablename__ = "recurring_invoices"
    __table_args__ = (
        Index("ix_recurring_invoices_next_run", "next_run"),
        Index("ix_recurring_invoices_status", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("auth_users.id", ondelete="CASCADE"), index=True
    )
    schedule: Mapped[str] = mapped_column(String(50), comment="Cron schedule expression")
    next_run: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    template: Mapped[dict] = mapped_column(JSON, comment="Invoice template data")
    status: Mapped[RecurringInvoiceStatus] = mapped_column(
        String(20), default=RecurringInvoiceStatus.ACTIVE
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[Optional["User"]] = relationship(back_populates="recurring_invoices")
    logs: Mapped[list["RecurringInvoiceLog"]] = relationship(
        back_populates="recurring_invoice", cascade="all, delete-orphan"
    )


class RecurringInvoiceLog(Base):
    """Audit log entries for recurring invoice executions."""

    __tablename__ = "recurring_invoice_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    recurring_invoice_id: Mapped[int] = mapped_column(
        ForeignKey("recurring_invoices.id", ondelete="CASCADE"), index=True
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    status: Mapped[str] = mapped_column(String(20), comment="success/failure")
    details: Mapped[Optional[str]] = mapped_column(Text)
    invoice_id: Mapped[Optional[int]] = mapped_column(Integer, index=True)

    recurring_invoice: Mapped[RecurringInvoice] = relationship(back_populates="logs")


__all__ = ["RecurringInvoice", "RecurringInvoiceLog", "RecurringInvoiceStatus"]
