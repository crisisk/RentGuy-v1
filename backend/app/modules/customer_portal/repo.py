"""
Repository layer for Customer Portal module
"""
from typing import Optional, List
from sqlalchemy import select, update, delete, func
from sqlalchemy.exc import SQLAlchemyError
from app.database import async_session
from app.modules.auth.models import User
from .models import UserProfile, Invoice, Order, Document
from .schemas import (
    UserProfileCreate,
    UserProfileResponse,
    InvoiceResponse,
    OrderResponse,
    DocumentResponse
)
from fastapi import HTTPException, status

class CustomerPortalRepo:
    """
    Database operations for customer portal components with proper error handling
    """

    async def get_profile(self, user_id: int) -> Optional[UserProfileResponse]:
        """
        Retrieve user profile by user ID

        Args:
            user_id: ID of the user

        Returns:
            UserProfileResponse: User profile data

        Raises:
            HTTPException: 404 if profile not found
        """
        try:
            async with async_session() as session:
                result = await session.execute(
                    select(UserProfile).where(UserProfile.user_id == user_id)
                )
                profile = result.scalar_one_or_none()
                
                if not profile:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="User profile not found"
                    )
                    
                return UserProfileResponse.model_validate(profile)
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )

    async def update_profile(self, user_id: int, profile_data: UserProfileCreate) -> UserProfileResponse:
        """
        Update user profile information

        Args:
            user_id: ID of the user
            profile_data: Profile data to update

        Returns:
            UserProfileResponse: Updated profile data
        """
        try:
            async with async_session() as session:
                result = await session.execute(
                    select(UserProfile).where(UserProfile.user_id == user_id)
                )
                profile = result.scalar_one_or_none()

                if not profile:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="User profile not found"
                    )

                for key, value in profile_data.model_dump(exclude_unset=True).items():
                    setattr(profile, key, value)

                await session.commit()
                await session.refresh(profile)
                return UserProfileResponse.model_validate(profile)
        except SQLAlchemyError as e:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )

    async def get_invoices(self, user_id: int, limit: int = 10, offset: int = 0) -> List[InvoiceResponse]:
        """
        Retrieve paginated list of user invoices

        Args:
            user_id: ID of the user
            limit: Number of items per page
            offset: Pagination offset

        Returns:
            List[InvoiceResponse]: List of invoices
        """
        try:
            async with async_session() as session:
                result = await session.execute(
                    select(Invoice)
                    .where(Invoice.user_id == user_id)
                    .order_by(Invoice.created_at.desc())
                    .limit(limit)
                    .offset(offset)
                )
                invoices = result.scalars().all()
                return [InvoiceResponse.model_validate(inv) for inv in invoices]
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )

    async def get_invoice(self, user_id: int, invoice_id: int) -> InvoiceResponse:
        """
        Get single invoice by ID with ownership check

        Args:
            user_id: ID of the user
            invoice_id: ID of the invoice

        Returns:
            InvoiceResponse: Invoice data

        Raises:
            HTTPException: 404 if invoice not found or access denied
        """
        try:
            async with async_session() as session:
                result = await session.execute(
                    select(Invoice)
                    .where(Invoice.id == invoice_id)
                    .where(Invoice.user_id == user_id)
                )
                invoice = result.scalar_one_or_none()
                
                if not invoice:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Invoice not found"
                    )
                    
                return InvoiceResponse.model_validate(invoice)
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )

    async def get_orders(self, user_id: int, limit: int = 10, offset: int = 0) -> List[OrderResponse]:
        """
        Retrieve paginated list of user orders

        Args:
            user_id: ID of the user
            limit: Number of items per page
            offset: Pagination offset

        Returns:
            List[OrderResponse]: List of orders
        """
        try:
            async with async_session() as session:
                result = await session.execute(
                    select(Order)
                    .where(Order.user_id == user_id)
                    .order_by(Order.order_date.desc())
                    .limit(limit)
                    .offset(offset)
                )
                orders = result.scalars().all()
                return [OrderResponse.model_validate(order) for order in orders]
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )

    async def get_documents(self, user_id: int, limit: int = 10, offset: int = 0) -> List[DocumentResponse]:
        """
        Retrieve paginated list of user documents

        Args:
            user_id: ID of the user
            limit: Number of items per page
            offset: Pagination offset

        Returns:
            List[DocumentResponse]: List of documents
        """
        try:
            async with async_session() as session:
                result = await session.execute(
                    select(Document)
                    .where(Document.user_id == user_id)
                    .order_by(Document.uploaded_at.desc())
                    .limit(limit)
                    .offset(offset)
                )
                documents = result.scalars().all()
                return [DocumentResponse.model_validate(doc) for doc in documents]
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )

    async def delete_document(self, user_id: int, document_id: int) -> None:
        """
        Delete a user document with ownership check

        Args:
            user_id: ID of the user
            document_id: ID of the document

        Raises:
            HTTPException: 404 if document not found or access denied
        """
        try:
            async with async_session() as session:
                result = await session.execute(
                    delete(Document)
                    .where(Document.id == document_id)
                    .where(Document.user_id == user_id)
                )
                await session.commit()
                
                if result.rowcount == 0:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Document not found"
                    )
        except SQLAlchemyError as e:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )