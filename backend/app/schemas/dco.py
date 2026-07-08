"""Pydantic schemas for the DCO creative uploads (Semaine 5, Jour 1).

Files are not persisted to disk — only their metadata is recorded in-memory
(see ``app.services.dco_service``), consistently with the rest of the mock
backend before PostgreSQL is wired.
"""
from datetime import datetime

from pydantic import BaseModel


class DcoAssetRead(BaseModel):
    id: int
    advertiser_id: int
    format: str
    filename: str
    content_type: str
    size_bytes: int
    uploaded_at: datetime
