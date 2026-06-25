from fastapi import APIRouter

from app.schemas.campaign import CampaignRead
from app.services import campaigns_service

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("", response_model=list[CampaignRead])
def list_campaigns():
    return campaigns_service.list_campaigns()
