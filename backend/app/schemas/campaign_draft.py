"""Pydantic schemas for the campaign-creation wizard drafts.

``DraftCreate`` is the body accepted by ``POST /api/campaigns/drafts`` — it
carries every field of the 4-step form. Validation is intentionally lenient so
that partially filled drafts ("Enregistrer le brouillon") can be saved; the
frontend enforces the stricter step-by-step rules before the final submit.
"""
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.core.enums import CampaignObjective


class DraftBase(BaseModel):
    # Step 1 — informations générales
    name: str
    advertiser_id: int | None = None
    objective: CampaignObjective | None = None
    start_date: date | None = None
    end_date: date | None = None
    total_budget: float = 0
    daily_budget: float = 0

    # Step 2 — ciblage technique
    devices: list[str] = []
    operating_systems: list[str] = []
    time_ranges: list[str] = []

    # Step 3 — formats publicitaires
    formats: list[str] = []

    # Step 4 — catégories d'applications
    app_categories: list[str] = []
    exclude_games: bool = True
    estimated_impressions: int | None = None


class DraftCreate(DraftBase):
    @field_validator("name")
    @classmethod
    def _name_not_blank(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Le nom de la campagne est obligatoire.")
        return value.strip()

    @field_validator("total_budget", "daily_budget")
    @classmethod
    def _budget_not_negative(cls, value: float) -> float:
        if value < 0:
            raise ValueError("Le budget ne peut pas être négatif.")
        return value

    @model_validator(mode="after")
    def _dates_coherent(self) -> "DraftCreate":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("La date de fin doit être postérieure à la date de début.")
        return self


class DraftRead(DraftBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    created_at: datetime
    updated_at: datetime
