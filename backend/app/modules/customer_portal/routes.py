FastAPI routes for Customer Portal module
"""
from fastapi import APIRouter, Depends, status, Query
from app.modules.auth.authStore import get_current_user
from .schemas import (
    UserProfileResponse,
    UserProfileCreate,
    PaginatedResponse,
    InvoiceResponse,
    OrderResponse,
    DocumentResponse,
    DocumentCreate
)
from .repo import CustomerPortalRepo
from typing import List, Optional

router = APIRouter(prefix="/customer-portal", tags=["Customer Portal"])

@router.get("/profile", response_model=UserProfileResponse, summary="Get user profile")
async def get_profile(
    repo: CustomerPortalRepo = Depends(),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve the authenticated user's profile

    Test scenarios:
    1. Authenticated user with profile: returns 200 with profile data
    2. Authenticated user without profile: returns 404
    3. Unauthenticated user: returns 401
    """
    return await repo.get_profile(current_user.id)

@router.put("/profile", response_model=UserProfileResponse, summary="Update user profile")
async def update_profile(
    profile_data: UserProfileCreate,
    repo: CustomerPortalRepo = Depends(),
    current_user: User = Depends(get_current_user)
):
    """
    Update the authenticated user's profile

    Test scenarios:
    1. Valid update data: returns 200 with updated profile
    2. Invalid phone number format: returns 422 validation error
    3. Unauthenticated user: returns 401
    """
    return await repo.update_profile(current_user.id, profile_data)

@router.get("/invoices", response_model=PaginatedResponse, summary="List user invoices")
async def list_invoices(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    repo: CustomerPortalRepo = Depends(),
    current_user: User = Depends(get_current_user)
):
    """
    Get paginated list of invoices for authenticated user

    Test scenarios:
    1. User with invoices: returns 200 with invoice list
    2. Invalid pagination parameters: returns 422 validation error
    3. Unauthenticated user: returns 401
    """
    invoices = await repo.get_invoices(current_user.id, limit, offset)
    total = await repo.get_invoice_count(current_user.id)
    return {"total": total, "items": invoices}

@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse, summary="Get invoice details")
async def get_invoice(
    invoice_id: int,
    repo: CustomerPortalRepo = Depends(),
    current_user: User = Depends(get_current_user)
):
    """
    Get details of a specific invoice

    Test scenarios:
    1. Valid invoice ID owned by user: returns 200 with invoice data
    2. Invoice ID not owned by user: returns 404
    3. Non-existent invoice ID: returns 404
    """
    return await repo.get_invoice(current_user.id, invoice_id)

@router.get("/orders", response_model=PaginatedResponse, summary="List user orders")
async def list_orders(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    repo: CustomerPortalRepo = Depends(),
    current_user: User = Depends(get_current_user)
):
    """
    Get paginated list of orders for authenticated user

    Test scenarios:
    1. User with orders: returns 200 with order list
    2. Invalid pagination parameters: returns 422 validation error
    3. Unauthenticated user: returns 401
    """
    orders = await repo.get_orders(current_user.id, limit, offset)
    total = await repo.get_order_count(current_user.id)
    return {"total": total, "items": orders}

@router.get("/documents", response_model=PaginatedResponse, summary="List user documents")
async def list_documents(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    repo: CustomerPortalRepo = Depends(),
    current_user: User = Depends(get_current_user)
):
    """
    Get paginated list of documents for authenticated user

    Test scenarios:
    1. User with documents: returns 200 with document list
    2. Invalid pagination parameters: returns 422 validation error
    3. Unauthenticated user: returns 401
    """
    documents = await repo.get_documents(current_user.id, limit, offset)
    total = await repo.get_document_count(current_user.id)
    return {"total": total, "items": documents}

@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete document")
async def delete_document(
    document_id: int,
    repo: CustomerPortalRepo = Depends(),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a user document

    Test scenarios:
    1. Valid document ID owned by user: returns 204
    2. Document ID not owned by user: returns 404
    3. Non-existent document ID: returns 404
    """
    await repo.delete_document(current_user.id, document_id)