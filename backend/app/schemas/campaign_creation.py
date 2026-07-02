"""Schemas describing the option catalog used by the campaign-creation wizard.

Served by ``GET /api/campaign-creation/options`` so the frontend and the backend
share a single, consistent vocabulary (stable slugs + French display labels).
"""
from pydantic import BaseModel


class Option(BaseModel):
    value: str
    label: str


class FormatOption(Option):
    description: str


class AdvertiserOption(BaseModel):
    value: int
    label: str


class CampaignCreationOptions(BaseModel):
    objectives: list[Option]
    advertisers: list[AdvertiserOption]
    devices: list[Option]
    operating_systems: list[Option]
    time_ranges: list[Option]
    formats: list[FormatOption]
    app_categories: list[Option]
