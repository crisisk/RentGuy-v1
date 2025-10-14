FastAPI routes for recurring invoices module
"""
from datetime import datetime
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
import croniter

from app.auth import get_current_user
from app.database import get_db
from . import models, schemas

router = APIRouter(prefix="/recurring-invoices", tags=["recurring_invoices"])

@router.post("/", response_model=schemas.RecurringInvoiceResponse)
async def create_recurring_invoice(
    invoice: schemas.RecurringInvoiceCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Create a new recurring invoice schedule
    
    Args:
        invoice: Recurring invoice data
        current_user: Authenticated user
        db: Database session
    
    Returns:
        Created recurring invoice
    """
    try:
        # Calculate next run time
        now = datetime.utcnow()
        cron = croniter.croniter(invoice.schedule, now)
        next_run = cron.get_next(datetime)
        
        db_invoice = models.RecurringInvoice(
            user_id=current_user["id"],
            schedule=invoice.schedule,
            next_run=next_run,
            template=invoice.template,
            status=invoice.status
        )
        db.add(db_invoice)
        db.commit()
        db.refresh(db_invoice)
        return db_invoice
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[schemas.RecurringInvoiceResponse])
async def get_recurring_invoices(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Get all recurring invoices for current user
    
    Args:
        current_user: Authenticated user
        db: Database session
    
    Returns:
        List of recurring invoices
    """
    return db.query(models.RecurringInvoice)\
             .filter(models.RecurringInvoice.user_id == current_user["id"])\
             .all()

@router.put("/{invoice_id}", response_model=schemas.RecurringInvoiceResponse)
async def update_recurring_invoice(
    invoice_id: int,
    invoice: schemas.RecurringInvoiceUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Update a recurring invoice schedule
    
    Args:
        invoice_id: ID of recurring invoice to update
        invoice: Updated data
        current_user: Authenticated user
        db: Database session
    
    Returns:
        Updated recurring invoice
    """
    db_invoice = db.query(models.RecurringInvoice)\
                   .filter(models.RecurringInvoice.id == invoice_id,
                           models.RecurringInvoice.user_id == current_user["id"])\
                   .first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Recurring invoice not found")

    try:
        update_data = invoice.dict(exclude_unset=True)
        if "schedule" in update_data:
            # Recalculate next run if schedule changes
            cron = croniter.croniter(update_data["schedule"], datetime.utcnow())
            update_data["next_run"] = cron.get_next(datetime)
        
        for key, value in update_data.items():
            setattr(db_invoice, key, value)
        
        db.commit()
        db.refresh(db_invoice)
        return db_invoice
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{invoice_id}")
async def delete_recurring_invoice(
    invoice_id: int,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Delete a recurring invoice schedule
    
    Args:
        invoice_id: ID of recurring invoice to delete
        current_user: Authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    db_invoice = db.query(models.RecurringInvoice)\
                   .filter(models.RecurringInvoice.id == invoice_id,
                           models.RecurringInvoice.user_id == current_user["id"])\
                   .first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Recurring invoice not found")

    try:
        db.delete(db_invoice)
        db.commit()
        return {"message": "Recurring invoice deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{invoice_id}/trigger", response_model=schemas.RecurringInvoiceLogResponse)
async def trigger_invoice_generation(
    invoice_id: int,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Manually trigger invoice generation
    
    Args:
        invoice_id: ID of recurring invoice to trigger
        current_user: Authenticated user
        db: Database session
    
    Returns:
        Generation log entry
    """
    db_invoice = db.query(models.RecurringInvoice)\
                   .filter(models.RecurringInvoice.id == invoice_id,
                           models.RecurringInvoice.user_id == current_user["id"])\
                   .first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Recurring invoice not found")

    try:
        # Placeholder for actual invoice generation logic
        generated_invoice_id = None
        log_entry = models.RecurringInvoiceLog(
            recurring_invoice_id=invoice_id,
            status="success",
            details="Invoice generated manually",
            invoice_id=generated_invoice_id
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
    except Exception as e:
        db.rollback()
        log_entry = models.RecurringInvoiceLog(
            recurring_invoice_id=invoice_id,
            status="failure",
            details=str(e)
        )
        db.add(log_entry)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Invoice generation failed: {str(e)}"
        )

@router.get("/{invoice_id}/logs", response_model=List[schemas.RecurringInvoiceLogResponse])
async def get_invoice_logs(
    invoice_id: int,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Get generation logs for a recurring invoice
    
    Args:
        invoice_id: ID of recurring invoice
        current_user: Authenticated user
        db: Database session
    
    Returns:
        List of log entries
    """
    db_invoice = db.query(models.RecurringInvoice)\
                   .filter(models.RecurringInvoice.id == invoice_id,
                           models.RecurringInvoice.user_id == current_user["id"])\
                   .first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Recurring invoice not found")

    return db_invoice.logs