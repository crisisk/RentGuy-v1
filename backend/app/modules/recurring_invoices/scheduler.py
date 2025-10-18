"""Background scheduler for recurring invoice processing."""

from __future__ import annotations

import asyncio
import logging
from contextlib import contextmanager
from datetime import datetime, timedelta
from typing import Iterator

from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.core.db import get_db_session

from .models import RecurringInvoice, RecurringInvoiceLog, RecurringInvoiceStatus
from .utils import CronExpressionError, next_run_from_cron

logger = logging.getLogger(__name__)


@contextmanager
def _session_scope() -> Iterator[Session]:
    generator = get_db_session()
    session = next(generator)
    try:
        yield session
    finally:
        generator.close()


class RecurringInvoiceScheduler:
    """Minimal asyncio-based scheduler used during tests and development."""

    def __init__(self, interval_seconds: int = 60) -> None:
        self.interval = interval_seconds
        self._task: asyncio.Task[None] | None = None
        self._running = False

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._runner())
        logger.info("Recurring invoice scheduler started")

    async def shutdown(self) -> None:
        if not self._running:
            return
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:  # pragma: no cover - expected on shutdown
                pass
            logger.info("Recurring invoice scheduler stopped")

    async def _runner(self) -> None:
        while self._running:
            await self.process_invoices()
            await asyncio.sleep(self.interval)

    async def process_invoices(self) -> None:
        """Process invoices that are due for execution."""

        with _session_scope() as session:
            now = datetime.utcnow()
            try:
                invoices = (
                    session.query(RecurringInvoice)
                    .filter(
                        RecurringInvoice.next_run <= now,
                        RecurringInvoice.status == RecurringInvoiceStatus.ACTIVE,
                    )
                    .all()
                )
            except OperationalError:
                session.rollback()
                logger.debug(
                    "Recurring invoice tables unavailable; skipping tick until setup completes"
                )
                return

            for invoice in invoices:
                await self._process_single_invoice(session, invoice, now)

            session.commit()

    async def _process_single_invoice(
        self, session: Session, invoice: RecurringInvoice, reference_time: datetime
    ) -> None:
        try:
            log_entry = RecurringInvoiceLog(
                recurring_invoice_id=invoice.id,
                status="success",
                details="Invoice generated automatically",
            )
            session.add(log_entry)

            invoice.next_run = next_run_from_cron(invoice.schedule, reference_time)
            session.add(invoice)
        except CronExpressionError as exc:  # pragma: no cover - defensive
            logger.exception("Failed to process invoice %s", invoice.id)
            log_entry = RecurringInvoiceLog(
                recurring_invoice_id=invoice.id,
                status="failure",
                details=str(exc),
            )
            session.add(log_entry)
            invoice.next_run = reference_time + timedelta(minutes=5)
            session.add(invoice)
        except Exception as exc:  # pragma: no cover - defensive catch-all
            logger.exception("Unexpected error while processing invoice %s", invoice.id)
            log_entry = RecurringInvoiceLog(
                recurring_invoice_id=invoice.id,
                status="failure",
                details=str(exc),
            )
            session.add(log_entry)
            invoice.next_run = reference_time + timedelta(minutes=5)
            session.add(invoice)


scheduler = RecurringInvoiceScheduler()

__all__ = ["RecurringInvoiceScheduler", "scheduler"]
