from __future__ import annotations

import hmac
import hashlib
import json
import time
from typing import Any, Dict

import httpx

from app.core.config import settings


class StripeAdapterError(RuntimeError):
    pass


class StripeAdapter:
    """Lightweight Stripe integration for checkout session creation and webhook validation."""

    def __init__(self, api_key: str | None = None, webhook_secret: str | None = None, api_base: str | None = None, timeout: float = 10.0) -> None:
        self.api_key = api_key or settings.STRIPE_API_KEY
        self.webhook_secret = webhook_secret or settings.STRIPE_WEBHOOK_SECRET
        self.api_base = api_base or settings.STRIPE_API_BASE
        self.timeout = timeout
        if not self.api_key:
            raise StripeAdapterError("Stripe API key is not configured")

    def _auth(self) -> tuple[str, str]:
        return self.api_key, ""

    def create_checkout_session(self, *, amount: float, currency: str, invoice_id: int, customer_email: str | None, success_url: str, cancel_url: str) -> Dict[str, Any]:
        endpoint = f"{self.api_base.rstrip('/')}/checkout/sessions"
        cents = int(round(amount * 100))
        payload = {
            "mode": "payment",
            "success_url": success_url,
            "cancel_url": cancel_url,
            "client_reference_id": str(invoice_id),
            "line_items[0][price_data][currency]": currency.lower(),
            "line_items[0][price_data][product_data][name]": f"Invoice #{invoice_id}",
            "line_items[0][price_data][unit_amount]": cents,
            "line_items[0][quantity]": 1,
        }
        if customer_email:
            payload["customer_email"] = customer_email
        try:
            response = httpx.post(endpoint, data=payload, auth=self._auth(), timeout=self.timeout)
            response.raise_for_status()
        except httpx.HTTPError as exc:  # pragma: no cover - network failure path
            raise StripeAdapterError(f"Stripe checkout session failed: {exc}") from exc
        return response.json()

    def verify_webhook(self, payload: bytes, signature_header: str, tolerance_seconds: int = 300) -> Dict[str, Any]:
        if not self.webhook_secret:
            raise StripeAdapterError("Stripe webhook secret not configured")
        timestamp = None
        signatures: list[str] = []
        for part in signature_header.split(","):
            if part.startswith("t="):
                timestamp = int(part.split("=", 1)[1])
            elif part.startswith("v1="):
                signatures.append(part.split("=", 1)[1])
        if not timestamp or not signatures:
            raise StripeAdapterError("Stripe signature header malformed")
        if abs(time.time() - timestamp) > tolerance_seconds:
            raise StripeAdapterError("Stripe webhook timestamp outside tolerance")
        signed_payload = f"{timestamp}.{payload.decode()}".encode()
        expected = hmac.new(self.webhook_secret.encode(), signed_payload, hashlib.sha256).hexdigest()
        if not any(hmac.compare_digest(expected, sig) for sig in signatures):
            raise StripeAdapterError("Stripe webhook signature mismatch")
        return json.loads(payload.decode())


def stripe_adapter_from_settings() -> StripeAdapter | None:
    if not settings.STRIPE_API_KEY:
        return None
    return StripeAdapter()
