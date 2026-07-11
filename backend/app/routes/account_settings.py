"""Flat, single-tenant account settings — ``/api/account-settings``.

Separate from the per-advertiser settings nested under
``/api/advertisers/{id}/settings`` (used by the « Gestion du compte » screen's
Paramètres tab): this is a single in-memory record, with the field names
requested for direct API testing (``company_name``, ``default_currency``,
``tracking_enabled``, ...).
"""
from fastapi import APIRouter

from app.schemas.account_settings import (
    GlobalAccountSettingsRead,
    GlobalAccountSettingsUpdate,
    GlobalAccountSettingsWrite,
)
from app.services import account_settings_service

router = APIRouter(prefix="/account-settings", tags=["account-settings"])


@router.get("", response_model=GlobalAccountSettingsRead)
def get_account_settings():
    return account_settings_service.get_global_settings()


@router.put("", response_model=GlobalAccountSettingsRead)
def replace_account_settings(payload: GlobalAccountSettingsWrite):
    return account_settings_service.replace_global_settings(payload.model_dump())


@router.patch("", response_model=GlobalAccountSettingsRead)
def patch_account_settings(payload: GlobalAccountSettingsUpdate):
    return account_settings_service.patch_global_settings(
        payload.model_dump(exclude_unset=True)
    )
