"""Advertiser data access. In-memory today; swap for DB queries later."""
from app.services import mock_data


class AdvertiserNotFoundError(LookupError):
    """Raised when an advertiser id doesn't match any mock record."""


def _find(advertiser_id: int) -> dict | None:
    return next((a for a in mock_data.ADVERTISERS if a["id"] == advertiser_id), None)


def _counts_for(advertiser_id: int) -> dict:
    """Campaigns/stores are derived from the existing mock lists, not stored
    redundantly on the advertiser record itself."""
    campaigns = sum(1 for c in mock_data.CAMPAIGNS if c["advertiser_id"] == advertiser_id)
    stores = sum(1 for s in mock_data.STORES if s["advertiser_id"] == advertiser_id)
    return {"campaigns_count": campaigns, "stores_count": stores}


def _enrich(advertiser: dict) -> dict:
    return {**advertiser, **_counts_for(advertiser["id"])}


def list_advertisers() -> list[dict]:
    return [_enrich(a) for a in mock_data.ADVERTISERS]


def get_advertiser(advertiser_id: int) -> dict:
    advertiser = _find(advertiser_id)
    if advertiser is None:
        raise AdvertiserNotFoundError(f"Annonceur {advertiser_id} introuvable.")
    return _enrich(advertiser)


def update_advertiser(advertiser_id: int, data: dict) -> dict:
    """Apply only the fields actually provided (PATCH semantics)."""
    advertiser = _find(advertiser_id)
    if advertiser is None:
        raise AdvertiserNotFoundError(f"Annonceur {advertiser_id} introuvable.")
    for key, value in data.items():
        if value is not None:
            advertiser[key] = value
    return _enrich(advertiser)
