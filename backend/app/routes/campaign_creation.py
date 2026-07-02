from fastapi import APIRouter

from app.schemas.campaign_creation import CampaignCreationOptions
from app.services import campaign_options

router = APIRouter(prefix="/campaign-creation", tags=["campaign-creation"])


@router.get("/options", response_model=CampaignCreationOptions)
def get_campaign_creation_options():
    """Option catalog powering the campaign-creation wizard (objectives,
    advertisers, devices, OS, time ranges, formats, app categories)."""
    return campaign_options.get_options()
