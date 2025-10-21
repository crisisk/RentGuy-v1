"""Database configuration helpers."""

from __future__ import annotations

from collections.abc import AsyncGenerator, Generator
from typing import Final

from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.engine.url import make_url
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    """Base declarative class shared across all modules."""


database_url: Final[str] = settings.database_url
url: Final[URL] = make_url(database_url)

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


def _async_drivername(source: URL) -> str:
    driver = source.drivername
    if driver.startswith("postgresql"):
        return driver.replace("postgresql", "postgresql+asyncpg", 1)
    if driver.startswith("mysql"):
        return driver.replace("mysql", "mysql+aiomysql", 1)
    if driver.startswith("sqlite"):
        return "sqlite+aiosqlite"
    raise ValueError(f"Unsupported database backend for async engine: {driver}")


engine = create_engine(database_url, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

async_engine: AsyncEngine = create_async_engine(
    url.set(drivername=_async_drivername(url)).render_as_string(hide_password=False),
    **engine_kwargs,
)
AsyncSessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)


def get_db_session() -> Generator[Session, None, None]:
    """Provide a database session for FastAPI dependencies."""

    with SessionLocal() as session:
        yield session


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async session that automatically rolls back on exception."""

    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:  # pragma: no cover - defensive rollback
            await session.rollback()
            raise


def database_ready() -> bool:
    """Perform a lightweight connectivity check against the database."""

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


__all__ = [
    "AsyncSession",
    "AsyncSessionLocal",
    "Base",
    "Session",
    "SessionLocal",
    "async_engine",
    "database_ready",
    "engine",
    "get_async_session",
    "get_db_session",
]
