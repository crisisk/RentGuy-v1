#!/usr/bin/env python3
"""Seed script to provision the Bart demo administrator account."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from passlib.context import CryptContext
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker


REPO_ROOT = Path(__file__).resolve().parent
BACKEND_PATH = REPO_ROOT / "backend"

# Ensure the backend package is importable when executed from the repo root.
if str(BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_PATH))

# Import models so SQLAlchemy registers relationship targets before they are referenced.
import app.modules.customer_portal.models  # noqa: F401  (register mappers)
import app.modules.recurring_invoices.models  # noqa: F401  (register mappers)
from app.modules.auth.models import User


# Database connection
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://rentguy:rentguy_secure_2025@db:5432/rentguy",
)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _ensure_user(session: Session, email: str, password: str) -> None:
    """Create or update an administrator user with the supplied credentials."""

    user = session.scalar(select(User).where(User.email == email))
    hashed_password = pwd_context.hash(password)

    if user is None:
        user = User(email=email, password_hash=hashed_password, role="admin")
        session.add(user)
        session.commit()
        print(f"✅ Created user: {email}")
    else:
        user.password_hash = hashed_password
        session.commit()
        print(f"✅ Password updated for {email}")


def create_bart_user() -> None:
    """Provision the Bart demo administrator and ensure the default demo account exists."""

    with SessionLocal() as session:
        try:
            _ensure_user(session, "bart@rentguy.demo", "mr-dj")
            _ensure_user(session, "rentguy@demo.local", "rentguy")
        except Exception as exc:  # pragma: no cover - defensive logging for manual scripts
            session.rollback()
            print(f"❌ Error creating user: {exc}")
            raise


if __name__ == "__main__":
    create_bart_user()
