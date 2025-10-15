"""Authentication domain models."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Column, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, relationship

from app.core.db import Base

if TYPE_CHECKING:  # pragma: no cover - circular imports for type hints only
    from app.modules.customer_portal.models import Document, Invoice, Order, UserProfile
    from app.modules.recurring_invoices.models import RecurringInvoice


class User(Base):
    """User account persisted within the authentication module."""

    __tablename__ = "auth_users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships exposed so the customer portal module can join against
    # invoices, orders, and uploaded documents without redefining the auth
    # models.  They remain optional to avoid pulling related rows unless they
    # are explicitly accessed.
    profile: Mapped[UserProfile | None] = relationship(
        "UserProfile", back_populates="user", uselist=False
    )
    invoices: Mapped[list[Invoice]] = relationship(
        "Invoice", back_populates="user", cascade="all,delete-orphan"
    )
    orders: Mapped[list[Order]] = relationship(
        "Order", back_populates="user", cascade="all,delete-orphan"
    )
    documents: Mapped[list[Document]] = relationship(
        "Document", back_populates="user", cascade="all,delete-orphan"
    )
    recurring_invoices: Mapped[list[RecurringInvoice]] = relationship(
        "RecurringInvoice", back_populates="user", cascade="all,delete-orphan"
    )


__all__ = ["User"]
