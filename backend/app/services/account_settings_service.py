"""Per-advertiser account settings (Semaine 6, Jour 1) — in-memory only.

Settings are lazily defaulted from the advertiser's own record the first time
they're requested, then kept in a simple in-memory dict once saved — the same
persistence style already used by ``draft_store.py`` / ``dco_service.py``.
"""
from datetime import datetime, timezone

from app.services import advertisers_service

_SETTINGS: dict[int, dict] = {}


def _default_settings(advertiser_id: int) -> dict:
    advertiser = advertisers_service.get_advertiser(advertiser_id)
    return {
        "advertiser_id": advertiser_id,
        "display_name": advertiser["name"],
        "currency": "MAD",
        "timezone": "Africa/Casablanca",
        "language": "fr",
        "notification_email": advertiser.get("email"),
        "notifications_enabled": True,
        "updated_at": None,
    }


def get_settings(advertiser_id: int) -> dict:
    """Raises AdvertiserNotFoundError (via get_advertiser) for an unknown id."""
    if advertiser_id in _SETTINGS:
        return _SETTINGS[advertiser_id]
    return _default_settings(advertiser_id)


def update_settings(advertiser_id: int, data: dict) -> dict:
    advertisers_service.get_advertiser(advertiser_id)  # validates the id exists
    settings = {
        **data,
        "advertiser_id": advertiser_id,
        "updated_at": datetime.now(timezone.utc),
    }
    _SETTINGS[advertiser_id] = settings
    return settings


# ---------------------------------------------------------------------------
# Flat, single-tenant settings (``/api/account-settings``) — a separate
# singleton record, not tied to any advertiser id. Kept apart from the
# per-advertiser dict above so neither shape has to compromise on field
# names (``company_name``/``default_currency``/``tracking_enabled`` here vs.
# ``display_name``/``currency``/``notifications_enabled`` above).
# ---------------------------------------------------------------------------
_GLOBAL_SETTINGS: dict = {
    "company_name": "SBS Data Factory",
    "default_currency": "MAD",
    "timezone": "Africa/Casablanca",
    "language": "fr",
    "notification_email": None,
    "tracking_enabled": True,
    "updated_at": None,
}


def get_global_settings() -> dict:
    return _GLOBAL_SETTINGS


def replace_global_settings(data: dict) -> dict:
    """Full replacement — used by ``PUT``. ``data`` is expected to carry every field."""
    _GLOBAL_SETTINGS.update(data)
    _GLOBAL_SETTINGS["updated_at"] = datetime.now(timezone.utc)
    return _GLOBAL_SETTINGS


def patch_global_settings(data: dict) -> dict:
    """Partial merge — used by ``PATCH``. ``data`` should already be pre-filtered
    (e.g. via ``model_dump(exclude_unset=True)``) so only explicitly-sent fields
    overwrite the stored record."""
    _GLOBAL_SETTINGS.update(data)
    _GLOBAL_SETTINGS["updated_at"] = datetime.now(timezone.utc)
    return _GLOBAL_SETTINGS
