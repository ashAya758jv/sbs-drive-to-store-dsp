from fastapi import APIRouter, HTTPException

from app.schemas.account_settings import AccountSettingsRead, AccountSettingsUpdate
from app.schemas.advertiser import AdvertiserRead, AdvertiserUpdate
from app.services import account_settings_service, advertisers_service
from app.services.advertisers_service import AdvertiserNotFoundError

router = APIRouter(prefix="/advertisers", tags=["advertisers"])


@router.get("", response_model=list[AdvertiserRead])
def list_advertisers():
    return advertisers_service.list_advertisers()


@router.get("/{advertiser_id}", response_model=AdvertiserRead)
def get_advertiser(advertiser_id: int):
    try:
        return advertisers_service.get_advertiser(advertiser_id)
    except AdvertiserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.patch("/{advertiser_id}", response_model=AdvertiserRead)
def update_advertiser(advertiser_id: int, payload: AdvertiserUpdate):
    try:
        return advertisers_service.update_advertiser(
            advertiser_id, payload.model_dump(exclude_unset=True)
        )
    except AdvertiserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/{advertiser_id}/settings", response_model=AccountSettingsRead)
def get_account_settings(advertiser_id: int):
    try:
        return account_settings_service.get_settings(advertiser_id)
    except AdvertiserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.patch("/{advertiser_id}/settings", response_model=AccountSettingsRead)
def update_account_settings(advertiser_id: int, payload: AccountSettingsUpdate):
    try:
        return account_settings_service.update_settings(
            advertiser_id, payload.model_dump()
        )
    except AdvertiserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
