"""Persistence helpers for platform secrets."""

from __future__ import annotations

from typing import Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import PlatformSecret


class PlatformSecretRepo:
    """Repository providing CRUD helpers for :class:`PlatformSecret`."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def list(self) -> list[PlatformSecret]:
        stmt = select(PlatformSecret).order_by(PlatformSecret.category, PlatformSecret.key)
        return list(self.session.scalars(stmt))

    def find(self, key: str) -> PlatformSecret | None:
        return self.session.get(PlatformSecret, key)

    def upsert(self, key: str, **attributes) -> PlatformSecret:
        secret = self.find(key)
        if secret is None:
            secret = PlatformSecret(key=key)
            self.session.add(secret)
        for attr, value in attributes.items():
            setattr(secret, attr, value)
        return secret

    def bulk_upsert(self, items: Iterable[tuple[str, dict]]) -> None:
        for key, attrs in items:
            self.upsert(key, **attrs)

    def delete(self, key: str) -> None:
        secret = self.find(key)
        if secret is not None:
            self.session.delete(secret)
