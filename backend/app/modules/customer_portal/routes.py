"""Customer portal API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.modules.auth.deps import get_current_user, get_db
from app.modules.auth.models import User

from .repo import CustomerPortalRepo
from .schemas import (
    DocumentCreate,
    DocumentResponse,
    InvoiceResponse,
    PaginatedDocumentsResponse,
    PaginatedInvoicesResponse,
    PaginatedOrdersResponse,
    UserProfileCreate,
    UserProfileResponse,
)

router = APIRouter(prefix="/customer-portal", tags=["Customer Portal"])


def get_repo(db: Session = Depends(get_db)) -> CustomerPortalRepo:
    return CustomerPortalRepo(db)


@router.get("/profile", response_model=UserProfileResponse, summary="Get user profile")
def get_profile(
    repo: CustomerPortalRepo = Depends(get_repo),
    current_user: User = Depends(get_current_user),
) -> UserProfileResponse:
    return repo.get_profile(current_user.id)


@router.put("/profile", response_model=UserProfileResponse, summary="Update user profile")
def update_profile(
    profile_data: UserProfileCreate,
    repo: CustomerPortalRepo = Depends(get_repo),
    current_user: User = Depends(get_current_user),
) -> UserProfileResponse:
    return repo.update_profile(current_user.id, profile_data)


@router.get(
    "/invoices",
    response_model=PaginatedInvoicesResponse,
    summary="List user invoices",
)
def list_invoices(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    repo: CustomerPortalRepo = Depends(get_repo),
    current_user: User = Depends(get_current_user),
) -> PaginatedInvoicesResponse:
    items = repo.list_invoices(current_user.id, limit=limit, offset=offset)
    total = repo.count_invoices(current_user.id)
    return PaginatedInvoicesResponse(total=total, items=items)


@router.get(
    "/invoices/{invoice_id}",
    response_model=InvoiceResponse,
    summary="Get invoice details",
)
def get_invoice(
    invoice_id: int,
    repo: CustomerPortalRepo = Depends(get_repo),
    current_user: User = Depends(get_current_user),
) -> InvoiceResponse:
    return repo.get_invoice(current_user.id, invoice_id)


@router.get(
    "/orders",
    response_model=PaginatedOrdersResponse,
    summary="List user orders",
)
def list_orders(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    repo: CustomerPortalRepo = Depends(get_repo),
    current_user: User = Depends(get_current_user),
) -> PaginatedOrdersResponse:
    items = repo.list_orders(current_user.id, limit=limit, offset=offset)
    total = repo.count_orders(current_user.id)
    return PaginatedOrdersResponse(total=total, items=items)


@router.get(
    "/documents",
    response_model=PaginatedDocumentsResponse,
    summary="List user documents",
)
def list_documents(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    repo: CustomerPortalRepo = Depends(get_repo),
    current_user: User = Depends(get_current_user),
) -> PaginatedDocumentsResponse:
    items = repo.list_documents(current_user.id, limit=limit, offset=offset)
    total = repo.count_documents(current_user.id)
    return PaginatedDocumentsResponse(total=total, items=items)


@router.post(
    "/documents",
    response_model=DocumentResponse,
    summary="Upload document metadata",
)
def create_document(
    payload: DocumentCreate,
    repo: CustomerPortalRepo = Depends(get_repo),
    current_user: User = Depends(get_current_user),
) -> DocumentResponse:
    return repo.create_document(current_user.id, payload)


@router.delete(
    "/documents/{document_id}",
    summary="Delete document",
)
def delete_document(
    document_id: int,
    repo: CustomerPortalRepo = Depends(get_repo),
    current_user: User = Depends(get_current_user),
) -> None:
    repo.delete_document(current_user.id, document_id)


__all__ = ["router"]
