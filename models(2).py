from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Numeric, Date, DateTime, func
from app.core.db import Base

class Invoice(Base):
    __tablename__ = "bil_invoices"
    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(Integer)
    client_name: Mapped[str] = mapped_column(String(200))
    currency: Mapped[str] = mapped_column(String(8), default="EUR")
    total_gross: Mapped[float] = mapped_column(Numeric(10,2), default=0)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft/sent/paid/void
    issued_at: Mapped[Date] = mapped_column(Date)
    due_at: Mapped[Date] = mapped_column(Date)

class Payment(Base):
    __tablename__ = "bil_payments"
    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_id: Mapped[int] = mapped_column(Integer)
    provider: Mapped[str] = mapped_column(String(20))  # stripe/mollie
    external_id: Mapped[str] = mapped_column(String(120))
    amount: Mapped[float] = mapped_column(Numeric(10,2), default=0)
    status: Mapped[str] = mapped_column(String(20))
    received_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
