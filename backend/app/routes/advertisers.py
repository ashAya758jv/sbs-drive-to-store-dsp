from fastapi import APIRouter

from app.schemas.advertiser import AdvertiserRead
from app.services import advertisers_service

router = APIRouter(prefix="/advertisers", tags=["advertisers"])


@router.get("", response_model=list[AdvertiserRead])
def list_advertisers():
    return advertisers_service.list_advertisers()
