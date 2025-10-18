from __future__ import annotations

import hashlib
import hmac
from typing import Any, Dict

import httpx

from app.core.config import settings


class MollieAdapterError(RuntimeError):
    pass


class MollieAdapter:
    def __init__(self, api_key: str | None = None, webhook_secret: str | None = None, api_base: str | None = None, timeout: float = 10.0) -> None:
        self.api_key = api_key or settings.MOLLIE_API_KEY
        self.webhook_secret = webhook_secret or settings.MOLLIE_WEBHOOK_SECRET
        self.api_base = api_base or settings.MOLLIE_API_BASE
        self.timeout = timeout
        if not self.api_key:
            raise MollieAdapterError("Mollie API key is not configured")

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def create_payment(self, *, amount: float, currency: str, description: str, redirect_url: str, webhook_url: str) -> Dict[str, Any]:
        endpoint = f"{self.api_base.rstrip('/')}/payments"
        payload = {
            "amount": {"currency": currency.upper(), "value": f"{amount:.2f}"},
            "description": description,
            "redirectUrl": redirect_url,
            "webhookUrl": webhook_url,
        }
        try:
            response = httpx.post(endpoint, json=payload, headers=self._headers(), timeout=self.timeout)
            response.raise_for_status()
        except httpx.HTTPError as exc:  # pragma: no cover - network failure path
            raise MollieAdapterError(f"Mollie payment creation failed: {exc}") from exc
        return response.json()

    def get_payment(self, payment_id: str) -> Dict[str, Any]:
        endpoint = f"{self.api_base.rstrip('/')}/payments/{payment_id}"
        try:
            response = httpx.get(endpoint, headers=self._headers(), timeout=self.timeout)
            response.raise_for_status()
        except httpx.HTTPError as exc:  # pragma: no cover - network failure path
            raise MollieAdapterError(f"Mollie payment fetch failed: {exc}") from exc
        return response.json()

    def verify_webhook(self, payload: bytes, signature: str) -> bool:
        if not self.webhook_secret:
            return True
        expected = hmac.new(self.webhook_secret.encode(), payload, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)


def mollie_adapter_from_settings() -> MollieAdapter | None:
    if not settings.MOLLIE_API_KEY:
        return None
    return MollieAdapter()
