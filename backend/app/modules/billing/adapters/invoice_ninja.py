from __future__ import annotations

from typing import Any, Dict

import httpx

from app.core.config import settings


class InvoiceNinjaError(RuntimeError):
    pass


class InvoiceNinjaClient:
    """Minimal Invoice Ninja API wrapper for invoice synchronisation."""

    def __init__(self, base_url: str | None = None, token: str | None = None, timeout: float = 10.0) -> None:
        self.base_url = base_url or settings.INVOICE_NINJA_URL
        self.token = token or settings.INVOICE_NINJA_TOKEN
        self.timeout = timeout
        if not self.base_url or not self.token:
            raise InvoiceNinjaError("Invoice Ninja credentials are not configured")

    def _headers(self) -> Dict[str, str]:
        return {
            "X-API-SECRET": self.token,
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "application/json",
        }

    def create_invoice(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        endpoint = f"{self.base_url.rstrip('/')}/api/v1/invoices"
        try:
            response = httpx.post(endpoint, json=payload, headers=self._headers(), timeout=self.timeout)
            response.raise_for_status()
        except httpx.HTTPError as exc:  # pragma: no cover - network failure path
            raise InvoiceNinjaError(f"Invoice Ninja request failed: {exc}") from exc
        return response.json()

    def record_payment(self, invoice_public_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        endpoint = f"{self.base_url.rstrip('/')}/api/v1/payments"
        body = {
            "invoice_id": invoice_public_id,
            **payload,
        }
        try:
            response = httpx.post(endpoint, json=body, headers=self._headers(), timeout=self.timeout)
            response.raise_for_status()
        except httpx.HTTPError as exc:  # pragma: no cover - network failure path
            raise InvoiceNinjaError(f"Invoice Ninja payment sync failed: {exc}") from exc
        return response.json()

    def test_connection(self) -> bool:
        endpoint = f"{self.base_url.rstrip('/')}/api/v1/ping"
        try:
            response = httpx.get(endpoint, headers=self._headers(), timeout=self.timeout)
            response.raise_for_status()
        except httpx.HTTPError as exc:  # pragma: no cover - network failure path
            raise InvoiceNinjaError(f"Invoice Ninja ping failed: {exc}") from exc
        return True


def invoice_ninja_from_settings() -> InvoiceNinjaClient | None:
    if not settings.INVOICE_NINJA_URL or not settings.INVOICE_NINJA_TOKEN:
        return None
    return InvoiceNinjaClient()
