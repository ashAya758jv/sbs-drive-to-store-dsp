"""Database wiring (PostgreSQL via SQLAlchemy).

The engine and session factory are created **lazily** so the API can boot and
serve mock data without a running PostgreSQL instance. Nothing here opens a
connection at import time.
"""
from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import settings

# Declarative base shared by every ORM model.
Base = declarative_base()

_engine: Engine | None = None
_SessionLocal: sessionmaker | None = None


def get_engine() -> Engine:
    """Create (once) and return the SQLAlchemy engine.

    The PostgreSQL driver is only imported on first connection, so importing
    this module never requires the database to be available.
    """
    global _engine
    if _engine is None:
        _engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, future=True)
    return _engine


def get_sessionmaker() -> sessionmaker:
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            bind=get_engine(), autoflush=False, autocommit=False, future=True
        )
    return _SessionLocal


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a database session.

    Reserved for the endpoints that will replace the mock services once the
    database is wired. Usage: ``db: Session = Depends(get_db)``.
    """
    session = get_sessionmaker()()
    try:
        yield session
    finally:
        session.close()


def init_db() -> None:
    """Create all tables from the ORM metadata.

    Call this manually (e.g. ``python -c "from app.database import init_db; init_db()"``)
    once a PostgreSQL database is configured. Not invoked at startup on purpose.
    """
    from app import models  # noqa: F401  (registers models on the metadata)

    Base.metadata.create_all(bind=get_engine())
