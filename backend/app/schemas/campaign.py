from datetime import date

from pydantic import BaseModel, ConfigDict

from app.core.enums import CampaignObjective, CampaignStatus


class CampaignRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    advertiser_id: int
    name: str
    objective: CampaignObjective
    status: CampaignStatus
    start_date: date | None = None
    end_date: date | None = None
    total_budget: float
    daily_budget: float
