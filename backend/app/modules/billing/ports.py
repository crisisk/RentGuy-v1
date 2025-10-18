"""Public billing service interface definitions."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Iterable, Optional

from .models import Invoice
from .schemas import InvoiceLineIn


@dataclass
class CheckoutResult:
    provider: str
    external_id: str
    checkout_url: str


class BillingPort(ABC):
    @abstractmethod
    def create_invoice(
        self,
        *,
        project_id: int,
        client_name: str,
        currency: str,
        issued_at,
        due_at,
        reference: Optional[str],
        vat_rate: Optional[float],
        line_items: Iterable[InvoiceLineIn],
        total_net_override: Optional[float],
        total_vat_override: Optional[float],
        sync_with_finance_bridge: bool,
    ) -> Invoice:
        """Create an invoice with calculated totals."""

    @abstractmethod
    def start_stripe_checkout(
        self,
        invoice: Invoice,
        *,
        success_url: str,
        cancel_url: str,
        customer_email: Optional[str],
    ) -> CheckoutResult:
        """Initiate a Stripe checkout session for an invoice."""

    @abstractmethod
    def start_mollie_payment(
        self,
        invoice: Invoice,
        *,
        redirect_url: str,
        webhook_url: str,
    ) -> CheckoutResult:
        """Initiate a Mollie payment for an invoice."""

    @abstractmethod
    def handle_stripe_event(self, event: dict) -> str:
        """Handle a Stripe webhook event and return the event type."""

    @abstractmethod
    def handle_mollie_notification(self, payment_id: str) -> dict:
        """Handle a Mollie webhook notification."""

