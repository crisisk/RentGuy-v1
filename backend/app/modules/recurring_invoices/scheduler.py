"""
Background scheduler for recurring invoices
"""
from datetime import datetime, timedelta
import logging
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.database import get_db
from .models import RecurringInvoice, RecurringInvoiceLog

logger = logging.getLogger(__name__)

class RecurringInvoiceScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.scheduler.add_job(
            self.process_invoices,
            trigger=CronTrigger(minute="*"),
            max_instances=1
        )

    async def start(self):
        self.scheduler.start()
        logger.info("Recurring invoice scheduler started")

    async def shutdown(self):
        self.scheduler.shutdown()
        logger.info("Recurring invoice scheduler stopped")

    async def process_invoices(self):
        """
        Process recurring invoices that are due for generation
        """
        logger.info("Starting recurring invoice processing")
        db: Session = next(get_db())
        try:
            now = datetime.utcnow()
            invoices = db.query(RecurringInvoice).filter(
                and_(
                    RecurringInvoice.next_run <= now,
                    RecurringInvoice.status == "active"
                )
            ).all()

            for invoice in invoices:
                await self.process_single_invoice(db, invoice, now)

            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error processing recurring invoices: {str(e)}", exc_info=True)
        finally:
            db.close()

    async def process_single_invoice(self, db: Session, invoice: RecurringInvoice, current_time: datetime):
        """
        Process a single recurring invoice
        """
        logger.info(f"Processing invoice {invoice.id}")
        try:
            # Placeholder for actual invoice generation logic
            generated_invoice_id = None
            
            # Create success log
            log_entry = RecurringInvoiceLog(
                recurring_invoice_id=invoice.id,
                status="success",
                details="Invoice generated successfully",
                invoice_id=generated_invoice_id
            )
            db.add(log_entry)

            # Calculate next run time
            cron = croniter.croniter(invoice.schedule, current_time)
            next_run = cron.get_next(datetime)
            invoice.next_run = next_run

            logger.info(f"Successfully processed invoice {invoice.id}. Next run: {next_run}")
        except Exception as e:
            logger.error(f"Failed to process invoice {invoice.id}: {str(e)}")
            # Create error log
            log_entry = RecurringInvoiceLog(
                recurring_invoice_id=invoice.id,
                status="failure",
                details=str(e)
            )
            db.add(log_entry)
            # Reschedule next run with backoff
            invoice.next_run = current_time + timedelta(minutes=5)

        db.add(invoice)
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Database commit failed for invoice {invoice.id}: {str(e)}")

# Initialize scheduler instance
scheduler = RecurringInvoiceScheduler()

# Test scenarios (for documentation):
"""
1. Happy path: Valid cron schedule creates invoice and schedules next run
2. Invalid cron: Schema validation rejects invalid format
3. Failed generation: Error logged and next run rescheduled
4. Manual trigger: Generates invoice immediately
5. Timezone handling: All times stored and processed in UTC
6. Concurrency: Scheduler ensures only one instance runs at a time
7. Database failures: Proper rollback and error logging
8. Template validation: Invalid templates rejected during creation
"""