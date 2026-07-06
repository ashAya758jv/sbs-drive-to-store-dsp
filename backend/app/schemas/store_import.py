"""Pydantic schemas for the client store import preview.

Returned by ``POST /api/stores/import/preview`` after parsing/validating an
uploaded ``.xlsx`` / ``.csv`` file. Nothing is persisted at the preview stage.
"""
from pydantic import BaseModel


class ImportedStore(BaseModel):
    """One valid row of the client file, ready to be imported."""

    store_id: str
    name: str
    city: str
    address: str
    latitude: float
    longitude: float
    opening_hours: str
    store_url: str


class RowError(BaseModel):
    """One validation error, located by file row number and field."""

    row: int
    field: str
    message: str


class StoreImportPreview(BaseModel):
    filename: str
    total_rows: int
    valid_count: int
    error_count: int
    stores: list[ImportedStore]
    errors: list[RowError]
    missing_columns: list[str] = []
    message: str
