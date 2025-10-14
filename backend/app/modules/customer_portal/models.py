"""
SQLAlchemy models for Customer Portal module
"""
from sqlalchemy import Column, String, ForeignKey, DateTime, Numeric, Integer, Text, Boolean
from sqlalchemy.orm import relationship, mapped_column, Mapped
from sqlalchemy.sql import func
from app.database import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True)
    company_name = Column(String(100))
    phone = Column(String(20))
    address = Column(Text)
    city = Column(String(50))
    state = Column(String(50))
    country = Column(String(50))
    postal_code = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="profile", uselist=False)

class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    amount = Column(Numeric(10, 2))
    due_date = Column(DateTime(timezone=True))
    status = Column(String(20), default="pending")  # pending, paid, overdue
    invoice_number = Column(String(50), unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="invoices")

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    order_number = Column(String(50), unique=True)
    product_name = Column(String(100))
    quantity = Column(Integer)
    total_price = Column(Numeric(10, 2))
    status = Column(String(20), default="processing")  # processing, shipped, delivered
    order_date = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="orders")

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    name = Column(String(100))
    file_path = Column(String(200))
    is_public = Column(Boolean, default=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))

    user = relationship("User", back_populates="documents")