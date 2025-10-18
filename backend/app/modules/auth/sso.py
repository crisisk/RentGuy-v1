"""Helpers for the marketing ↔ platform OAuth2 single sign-on flow."""

from __future__ import annotations

import asyncio
import base64
import hashlib
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
import jwt


@dataclass
class SSOState:
    """Represents a pending OAuth2 authorization request."""

    state: str
    code_verifier: str
    redirect_uri: str
    return_url: str | None
    created_at: datetime


class SSOStateStore:
    """Stores transient SSO state entries with an in-memory TTL cache."""

    def __init__(self, ttl_seconds: int = 600) -> None:
        self._ttl = ttl_seconds
        self._entries: dict[str, SSOState] = {}
        self._lock = asyncio.Lock()

    @property
    def ttl_seconds(self) -> int:
        return self._ttl

    async def save(self, entry: SSOState) -> None:
        async with self._lock:
            self._purge_locked()
            self._entries[entry.state] = entry

    async def pop(self, state: str) -> SSOState | None:
        async with self._lock:
            self._purge_locked()
            entry = self._entries.pop(state, None)
        if not entry:
            return None
        if self._is_expired(entry):
            return None
        return entry

    def _purge_locked(self) -> None:
        now = datetime.now(tz=timezone.utc)
        expired = [key for key, entry in self._entries.items() if self._is_expired(entry, now)]
        for key in expired:
            self._entries.pop(key, None)

    def _is_expired(self, entry: SSOState, now: datetime | None = None) -> bool:
        reference = now or datetime.now(tz=timezone.utc)
        return entry.created_at + timedelta(seconds=self._ttl) <= reference


def generate_state() -> str:
    return secrets.token_urlsafe(24)


def generate_code_verifier() -> str:
    # RFC 7636 recommends code verifiers between 43 and 128 characters.
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode("ascii").rstrip("=")


def code_challenge(code_verifier: str) -> str:
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")


class AzureSSOError(RuntimeError):
    """Raised when Azure AD B2C returns an unexpected response."""


class AzureB2CSSOClient:
    """Minimal client tailored to exchanging authorization codes for Mr. DJ."""

    def __init__(
        self,
        authority: str,
        client_id: str,
        scope: str,
        client_secret: str | None = None,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.authority = authority.rstrip("/")
        self.client_id = client_id
        self.scope = scope
        self.client_secret = client_secret
        self._transport = transport

    @property
    def authorization_endpoint(self) -> str:
        return f"{self.authority}/oauth2/v2.0/authorize"

    @property
    def token_endpoint(self) -> str:
        return f"{self.authority}/oauth2/v2.0/token"

    def build_authorization_url(self, *, redirect_uri: str, state: str, code_challenge_value: str) -> str:
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "response_mode": "query",
            "scope": self.scope,
            "state": state,
            "code_challenge": code_challenge_value,
            "code_challenge_method": "S256",
        }
        encoded = httpx.QueryParams(params)
        return f"{self.authorization_endpoint}?{encoded}"  # type: ignore[str-format]

    async def exchange_code(
        self,
        *,
        code: str,
        redirect_uri: str,
        code_verifier: str,
    ) -> dict[str, Any]:
        data = {
            "client_id": self.client_id,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "code_verifier": code_verifier,
            "scope": self.scope,
        }
        if self.client_secret:
            data["client_secret"] = self.client_secret

        async with httpx.AsyncClient(transport=self._transport, timeout=10.0) as client:
            response = await client.post(self.token_endpoint, data=data)

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:  # pragma: no cover - defensive
            detail = exc.response.text
            raise AzureSSOError(f"Token exchange failed: {detail}") from exc

        payload = response.json()
        if "id_token" not in payload:
            raise AzureSSOError("Identity provider response missing id_token")
        return payload

    @staticmethod
    def parse_id_token(id_token: str) -> dict[str, Any]:
        return jwt.decode(id_token, options={"verify_signature": False, "verify_aud": False})


__all__ = [
    "AzureB2CSSOClient",
    "AzureSSOError",
    "SSOState",
    "SSOStateStore",
    "code_challenge",
    "generate_code_verifier",
    "generate_state",
]
