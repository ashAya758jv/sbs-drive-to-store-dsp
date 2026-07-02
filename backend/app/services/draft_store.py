"""Persistence layer for campaign drafts.

Uses SQLAlchemy against ``DATABASE_URL`` (PostgreSQL in production). If that
database is unreachable — the common case on a developer machine without a
running PostgreSQL — it transparently falls back to a local SQLite file so the
campaign-creation flow stays testable end to end.

The fallback is **development-only**: it never changes the PostgreSQL-targeted
models or migrations, and the SQLite file is git-ignored. The backend chosen at
runtime is reported by :func:`backend_kind`.
"""
from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.database import Base
from app.models.campaign_draft import CampaignDraft

# Local SQLite fallback lives under backend/.local/ (git-ignored, never committed).
_LOCAL_DIR = Path(__file__).resolve().parents[2] / ".local"
_SQLITE_PATH = _LOCAL_DIR / "campaign_drafts.db"

_SessionLocal: sessionmaker | None = None
_backend_kind: str | None = None

# Keys that are stored inside the JSON ``payload`` column rather than as
# dedicated table columns.
_PAYLOAD_KEYS = (
    "devices",
    "operating_systems",
    "time_ranges",
    "formats",
    "app_categories",
    "exclude_games",
    "estimated_impressions",
)


def _configured_engine():
    """Engine for the configured database, verified with a real connection."""
    url = settings.DATABASE_URL
    connect_args = {"connect_timeout": 2} if url.startswith("postgres") else {}
    engine = create_engine(url, pool_pre_ping=True, future=True, connect_args=connect_args)
    # Force an actual connection so an unreachable PostgreSQL fails fast here
    # and we can fall back, instead of failing later inside a request.
    with engine.connect():
        pass
    return engine


def _sqlite_engine():
    """Engine for the local dev fallback (SQLite file under backend/.local/)."""
    _LOCAL_DIR.mkdir(parents=True, exist_ok=True)
    return create_engine(
        f"sqlite:///{_SQLITE_PATH.as_posix()}",
        future=True,
        connect_args={"check_same_thread": False},
    )


def _init() -> None:
    """Resolve the engine once, then create the ``campaign_drafts`` table."""
    global _SessionLocal, _backend_kind
    if _SessionLocal is not None:
        return
    try:
        engine = _configured_engine()
        _backend_kind = "postgresql"
    except Exception:
        engine = _sqlite_engine()
        _backend_kind = "sqlite"
    # Only ever create the one table this module owns.
    Base.metadata.create_all(bind=engine, tables=[CampaignDraft.__table__])
    _SessionLocal = sessionmaker(
        bind=engine, autoflush=False, autocommit=False, future=True
    )


def _session():
    _init()
    return _SessionLocal()


def backend_kind() -> str:
    """Return which backend is in use: ``"postgresql"`` or ``"sqlite"``."""
    _init()
    return _backend_kind  # type: ignore[return-value]


def _to_dict(row: CampaignDraft) -> dict:
    """Flatten a row (columns + JSON payload) into the shape ``DraftRead`` expects."""
    payload = row.payload or {}
    return {
        "id": row.id,
        "status": row.status,
        "name": row.name,
        "advertiser_id": row.advertiser_id,
        "objective": row.objective,
        "start_date": row.start_date,
        "end_date": row.end_date,
        "total_budget": float(row.total_budget) if row.total_budget is not None else 0.0,
        "daily_budget": float(row.daily_budget) if row.daily_budget is not None else 0.0,
        "devices": payload.get("devices", []),
        "operating_systems": payload.get("operating_systems", []),
        "time_ranges": payload.get("time_ranges", []),
        "formats": payload.get("formats", []),
        "app_categories": payload.get("app_categories", []),
        "exclude_games": payload.get("exclude_games", True),
        "estimated_impressions": payload.get("estimated_impressions"),
        "created_at": row.created_at,
        "updated_at": row.updated_at,
    }


def _objective_value(objective) -> str | None:
    """Accept either an enum member or a plain string."""
    return objective.value if hasattr(objective, "value") else objective


def save_draft(data: dict) -> dict:
    """Persist a new draft (always with status ``draft``) and return it."""
    payload = {key: data.get(key) for key in _PAYLOAD_KEYS}
    row = CampaignDraft(
        name=data["name"],
        advertiser_id=data.get("advertiser_id"),
        objective=_objective_value(data.get("objective")),
        status="draft",
        start_date=data.get("start_date"),
        end_date=data.get("end_date"),
        total_budget=data.get("total_budget") or 0,
        daily_budget=data.get("daily_budget") or 0,
        payload=payload,
    )
    session = _session()
    try:
        session.add(row)
        session.commit()
        session.refresh(row)
        return _to_dict(row)
    finally:
        session.close()


def list_drafts() -> list[dict]:
    """Return every draft, newest first."""
    session = _session()
    try:
        rows = session.query(CampaignDraft).order_by(CampaignDraft.id.desc()).all()
        return [_to_dict(row) for row in rows]
    finally:
        session.close()


def get_draft(draft_id: int) -> dict | None:
    """Return a single draft by id, or ``None`` if it does not exist."""
    session = _session()
    try:
        row = session.get(CampaignDraft, draft_id)
        return _to_dict(row) if row else None
    finally:
        session.close()
