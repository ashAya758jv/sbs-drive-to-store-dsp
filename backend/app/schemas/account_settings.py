"""Per-advertiser account settings (Semaine 6, Jour 1) — currency, timezone,
language and notification preferences. In-memory only, no PostgreSQL.
"""
from datetime import datetime

from pydantic import BaseModel, EmailStr


class AccountSettingsRead(BaseModel):
    advertiser_id: int
    display_name: str
    currency: str = "MAD"
    timezone: str = "Africa/Casablanca"
    language: str = "fr"
    notification_email: EmailStr | None = None
    notifications_enabled: bool = True
    updated_at: datetime | None = None


class AccountSettingsUpdate(BaseModel):
    display_name: str
    currency: str = "MAD"
    timezone: str = "Africa/Casablanca"
    language: str = "fr"
    notification_email: EmailStr | None = None
    notifications_enabled: bool = True


class GlobalAccountSettingsRead(BaseModel):
    """Flat, single-tenant settings resource exposed at ``/api/account-settings``.

    Distinct from ``AccountSettingsRead`` above (which is keyed per advertiser,
    used by the « Gestion du compte » screen's Paramètres tab): this is a
    single in-memory record, not tied to any advertiser id.
    """

    company_name: str
    default_currency: str = "MAD"
    timezone: str = "Africa/Casablanca"
    language: str = "fr"
    notification_email: EmailStr | None = None
    tracking_enabled: bool = True
    updated_at: datetime | None = None


class GlobalAccountSettingsWrite(BaseModel):
    """Full replacement body for ``PUT /api/account-settings``."""

    company_name: str
    default_currency: str = "MAD"
    timezone: str = "Africa/Casablanca"
    language: str = "fr"
    notification_email: EmailStr | None = None
    tracking_enabled: bool = True


class GlobalAccountSettingsUpdate(BaseModel):
    """Partial update body for ``PATCH /api/account-settings`` — every field optional."""

    company_name: str | None = None
    default_currency: str | None = None
    timezone: str | None = None
    language: str | None = None
    notification_email: EmailStr | None = None
    tracking_enabled: bool | None = None
