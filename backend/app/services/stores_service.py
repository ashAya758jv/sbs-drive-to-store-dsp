"""Store data access. Returns mock data today; swap for DB queries later."""
from app.services import mock_data


def list_stores() -> list[dict]:
    return mock_data.STORES
