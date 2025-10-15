"""Repository helpers for the customer portal."""

from __future__ import annotations

from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import Select, delete, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from .models import Document, Invoice, Order, UserProfile
from .schemas import (
    DocumentCreate,
    DocumentResponse,
    InvoiceResponse,
    OrderResponse,
    UserProfileCreate,
    UserProfileResponse,
)


class CustomerPortalRepo:
    """Encapsulate database access for customer portal operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Profile helpers
    def get_profile(self, user_id: int) -> UserProfileResponse:
        profile = self.db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        ).scalar_one_or_none()

        if profile is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User profile not found")

        return UserProfileResponse.model_validate(profile)

    def update_profile(
        self, user_id: int, payload: UserProfileCreate
    ) -> UserProfileResponse:
        profile = self.db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        ).scalar_one_or_none()

        if profile is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User profile not found")

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(profile, field, value)

        try:
            self.db.add(profile)
            self.db.commit()
        except SQLAlchemyError as exc:  # pragma: no cover - defensive
            self.db.rollback()
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                f"Failed to update profile: {exc}",
            ) from exc

        self.db.refresh(profile)
        return UserProfileResponse.model_validate(profile)

    # ------------------------------------------------------------------
    # Invoice helpers
    def list_invoices(self, user_id: int, *, limit: int, offset: int) -> Sequence[InvoiceResponse]:
        stmt: Select[tuple[Invoice]] = (
            select(Invoice)
            .where(Invoice.user_id == user_id)
            .order_by(Invoice.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        invoices = self.db.execute(stmt).scalars().all()
        return [InvoiceResponse.model_validate(row) for row in invoices]

    def count_invoices(self, user_id: int) -> int:
        stmt = select(func.count(Invoice.id)).where(Invoice.user_id == user_id)
        return self.db.execute(stmt).scalar_one()

    def get_invoice(self, user_id: int, invoice_id: int) -> InvoiceResponse:
        invoice = self.db.execute(
            select(Invoice)
            .where(Invoice.user_id == user_id)
            .where(Invoice.id == invoice_id)
        ).scalar_one_or_none()

        if invoice is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")

        return InvoiceResponse.model_validate(invoice)

    # ------------------------------------------------------------------
    # Order helpers
    def list_orders(self, user_id: int, *, limit: int, offset: int) -> Sequence[OrderResponse]:
        stmt: Select[tuple[Order]] = (
            select(Order)
            .where(Order.user_id == user_id)
            .order_by(Order.order_date.desc())
            .limit(limit)
            .offset(offset)
        )
        orders = self.db.execute(stmt).scalars().all()
        return [OrderResponse.model_validate(row) for row in orders]

    def count_orders(self, user_id: int) -> int:
        stmt = select(func.count(Order.id)).where(Order.user_id == user_id)
        return self.db.execute(stmt).scalar_one()

    # ------------------------------------------------------------------
    # Document helpers
    def list_documents(
        self, user_id: int, *, limit: int, offset: int
    ) -> Sequence[DocumentResponse]:
        stmt: Select[tuple[Document]] = (
            select(Document)
            .where(Document.user_id == user_id)
            .order_by(Document.uploaded_at.desc())
            .limit(limit)
            .offset(offset)
        )
        documents = self.db.execute(stmt).scalars().all()
        return [DocumentResponse.model_validate(row) for row in documents]

    def count_documents(self, user_id: int) -> int:
        stmt = select(func.count(Document.id)).where(Document.user_id == user_id)
        return self.db.execute(stmt).scalar_one()

    def create_document(
        self, user_id: int, payload: DocumentCreate
    ) -> DocumentResponse:
        document = Document(user_id=user_id, **payload.model_dump())
        try:
            self.db.add(document)
            self.db.commit()
        except SQLAlchemyError as exc:  # pragma: no cover - defensive
            self.db.rollback()
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                f"Failed to create document: {exc}",
            ) from exc

        self.db.refresh(document)
        return DocumentResponse.model_validate(document)

    def delete_document(self, user_id: int, document_id: int) -> None:
        stmt = (
            delete(Document)
            .where(Document.user_id == user_id)
            .where(Document.id == document_id)
        )
        result = self.db.execute(stmt)
        if result.rowcount == 0:
            self.db.rollback()
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")

        self.db.commit()


__all__ = ["CustomerPortalRepo"]
