"""Aggregates every route module under a single ``api_router``.

Mounted in ``main.py`` with the ``/api`` prefix, so the final paths are
``/api/health``, ``/api/users``, ``/api/statistics/dashboard``, etc.
"""
from fastapi import APIRouter

from app.routes import (
    account_settings,
    advertisers,
    campaign_creation,
    campaigns,
    dco,
    health,
    statistics,
    store_import,
    stores,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(users.router)
api_router.include_router(advertisers.router)
api_router.include_router(account_settings.router)
api_router.include_router(stores.router)
api_router.include_router(store_import.router)
api_router.include_router(campaigns.router)
api_router.include_router(campaign_creation.router)
api_router.include_router(dco.router)
api_router.include_router(statistics.router)

__all__ = ["api_router"]
