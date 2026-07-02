"""Campaign data access.

Reads still return mock data (swapped for DB queries later), while campaign
*drafts* created by the multi-step wizard are persisted through
:mod:`app.services.draft_store` (PostgreSQL, with a local SQLite dev fallback).
"""
from app.schemas.campaign_draft import DraftCreate
from app.services import draft_store, mock_data


def list_campaigns() -> list[dict]:
    return mock_data.CAMPAIGNS


def create_draft(data: DraftCreate) -> dict:
    """Persist a new campaign draft (status ``draft``)."""
    return draft_store.save_draft(data.model_dump())


def list_drafts() -> list[dict]:
    return draft_store.list_drafts()


def get_draft(draft_id: int) -> dict | None:
    return draft_store.get_draft(draft_id)
