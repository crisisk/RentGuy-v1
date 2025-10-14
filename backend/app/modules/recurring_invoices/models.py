"""
SQLAlchemy models for recurring invoices module
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class RecurringInvoiceStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


class RecurringInvoice(Base):
    __tablename__ = "recurring_invoices"
    __table_args__ = (
        Index("ix_recurring_invoices_next_run", "next_run"),
        Index("ix_recurring_invoices_status", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    schedule: Mapped[str] = mapped_column(String(50), comment="Cron schedule expression")
    next_run: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    template: Mapped[dict] = mapped_column(JSON, comment="Invoice template data")
    status: Mapped[RecurringInvoiceStatus] = mapped_column(String(20), default=RecurringInvoiceStatus.ACTIVE)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="recurring_invoices")
    logs: Mapped[list["RecurringInvoiceLog"]] = relationship(back_populates="recurring_invoice", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<RecurringInvoice {self.id} ({self.status})>"


class RecurringInvoiceLog(Base):
    __tablename__ = "recurring_invoice_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    recurring_invoice_id: Mapped[int] = mapped_column(Integer, ForeignKey("recurring_invoices.id"), index=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(20), comment="success/failure")
    details: Mapped[Optional[str]] = mapped_column(Text, comment="Error details or success message")
    invoice_id: Mapped[Optional[int]] = mapped_column(Integer, index=True, comment="Reference to generated invoice")

    recurring_invoice: Mapped["RecurringInvoice"] = relationship(back_populates="logs")

    def __repr__(self):
        return f"<RecurringInvoiceLog {self.id} ({self.status})>"