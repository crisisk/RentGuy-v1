"""Database configuration helpers."""

from __future__ import annotations

from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

class Base(DeclarativeBase):
    pass

database_url = settings.database_url
url = make_url(database_url)

engine_kwargs: dict[str, object] = {"pool_pre_ping": True}

if url.get_backend_name().startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

    # Share a single in-memory database across connections when running with
    # `sqlite://` (used heavily in tests) by switching to a StaticPool.
    if url.database in (None, "", ":memory:"):
        from sqlalchemy.pool import StaticPool

        engine_kwargs["poolclass"] = StaticPool
else:
    engine_kwargs.update(
        {
            "pool_size": settings.DB_POOL_SIZE,
            "max_overflow": settings.DB_MAX_OVERFLOW,
            "pool_timeout": settings.DB_POOL_TIMEOUT,
        }
    )

engine = create_engine(database_url, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db_session() -> Generator[Session, None, None]:
    """Provide a database session for FastAPI dependencies."""

    with SessionLocal() as session:
        yield session


def database_ready() -> bool:
    """Perform a lightweight connectivity check against the database."""

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
