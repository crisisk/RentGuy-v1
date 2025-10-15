"""SQLAlchemy models for the customer portal module."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class UserProfile(Base):
    """Extended profile data linked to an authenticated user."""

    __tablename__ = "customer_portal_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("auth_users.id", ondelete="CASCADE"), unique=True, index=True
    )
    company_name: Mapped[str | None] = mapped_column(String(100))
    phone: Mapped[str | None] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(String(200))
    city: Mapped[str | None] = mapped_column(String(50))
    state: Mapped[str | None] = mapped_column(String(50))
    country: Mapped[str | None] = mapped_column(String(50))
    postal_code: Mapped[str | None] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    user = relationship("User", back_populates="profile")


class Invoice(Base):
    """Invoices surfaced to end users through the portal."""

    __tablename__ = "customer_portal_invoices"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("auth_users.id", ondelete="CASCADE"), index=True
    )
    amount: Mapped[Numeric] = mapped_column(Numeric(10, 2))
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    user = relationship("User", back_populates="invoices")


class Order(Base):
    """Orders created by the user that can be reviewed online."""

    __tablename__ = "customer_portal_orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("auth_users.id", ondelete="CASCADE"), index=True
    )
    order_number: Mapped[str] = mapped_column(String(50), unique=True)
    product_name: Mapped[str] = mapped_column(String(100))
    quantity: Mapped[int] = mapped_column(Integer)
    total_price: Mapped[Numeric] = mapped_column(Numeric(10, 2))
    status: Mapped[str] = mapped_column(String(20), default="processing")
    order_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    user = relationship("User", back_populates="orders")


class Document(Base):
    """Documents shared with the customer via the portal."""

    __tablename__ = "customer_portal_documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("auth_users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(100))
    file_path: Mapped[str] = mapped_column(String(200))
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user = relationship("User", back_populates="documents")


__all__ = ["UserProfile", "Invoice", "Order", "Document"]
