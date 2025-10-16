"""Utilities to encrypt and decrypt managed secret values."""

from __future__ import annotations

import base64
from functools import lru_cache

from app.core.config import settings


class SecretDecryptionError(RuntimeError):
    """Raised when a stored secret cannot be decrypted."""


@lru_cache(maxsize=1)
def _get_key_material() -> bytes:
    encoded = settings.secrets_encryption_key
    if not encoded:
        raise SecretDecryptionError("Encryption key is not configured")
    try:
        return base64.urlsafe_b64decode(encoded)
    except Exception as exc:  # pragma: no cover - defensive
        raise SecretDecryptionError("Invalid encryption key material") from exc


def encrypt_value(value: str) -> bytes:
    """Encrypt a secret using a reversible XOR scheme with base64 encoding."""

    key = _get_key_material()
    data = value.encode("utf-8")
    encrypted = bytes(byte ^ key[i % len(key)] for i, byte in enumerate(data))
    return base64.urlsafe_b64encode(encrypted)


def decrypt_value(payload: bytes) -> str:
    """Decrypt a previously stored secret."""

    key = _get_key_material()
    try:
        decoded = base64.urlsafe_b64decode(payload)
    except Exception as exc:  # pragma: no cover - defensive
        raise SecretDecryptionError("Encrypted payload is malformed") from exc

    decrypted = bytes(byte ^ key[i % len(key)] for i, byte in enumerate(decoded))
    try:
        return decrypted.decode("utf-8")
    except UnicodeDecodeError as exc:  # pragma: no cover - defensive
        raise SecretDecryptionError("Decrypted payload could not be decoded") from exc


def build_hint(value: str) -> str:
    """Create a small hint for display purposes without leaking the full value."""

    stripped = value.strip()
    if not stripped:
        return ""
    if len(stripped) <= 6:
        return "•" * len(stripped)
    return f"{stripped[:2]}•••{stripped[-2:]}"
