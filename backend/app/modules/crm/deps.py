from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException

from app.core.config import settings


class LeadCaptureRateLimiter:
    """In-memory sliding window limiter keyed by tenant and source IP."""

    def __init__(self, limit: int, window_seconds: int) -> None:
        self._limit = limit
        self._window = window_seconds
        self._lock = asyncio.Lock()
        self._hits: dict[str, list[datetime]] = {}

    async def hit(self, key: str) -> None:
        if self._limit <= 0:
            return
        now = datetime.now(tz=timezone.utc)
        window_start = now - timedelta(seconds=self._window)
        async with self._lock:
            timestamps = [ts for ts in self._hits.get(key, []) if ts >= window_start]
            if len(timestamps) >= self._limit:
                raise HTTPException(status_code=429, detail="Lead capture rate limit exceeded")
            timestamps.append(now)
            self._hits[key] = timestamps


class CaptchaVerifier:
    """Validates captcha tokens against the configured verification endpoint."""

    async def verify(self, token: str, remote_ip: str | None = None) -> None:
        endpoint = settings.MRDJ_LEAD_CAPTURE_CAPTCHA_ENDPOINT
        secret = (
            settings.MRDJ_LEAD_CAPTURE_CAPTCHA_SECRET.get_secret_value()
            if settings.MRDJ_LEAD_CAPTURE_CAPTCHA_SECRET
            else None
        )
        if not endpoint or not secret:
            return

        payload = {"secret": secret, "response": token}
        if remote_ip:
            payload["remoteip"] = remote_ip

        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(endpoint, data=payload)

        try:
            response.raise_for_status()
        except httpx.HTTPError as exc:  # pragma: no cover - defensive
            raise HTTPException(status_code=502, detail="Captcha verification failed") from exc

        data = response.json()
        if not data.get("success"):
            raise HTTPException(status_code=400, detail="Captcha validation failed")


_rate_limiter = LeadCaptureRateLimiter(
    limit=settings.MRDJ_LEAD_CAPTURE_RATE_LIMIT,
    window_seconds=settings.MRDJ_LEAD_CAPTURE_RATE_WINDOW_SECONDS,
)
_captcha_verifier = CaptchaVerifier()


def get_rate_limiter() -> LeadCaptureRateLimiter:
    return _rate_limiter


def get_captcha_verifier() -> CaptchaVerifier:
    return _captcha_verifier


__all__ = [
    "CaptchaVerifier",
    "LeadCaptureRateLimiter",
    "get_captcha_verifier",
    "get_rate_limiter",
]
