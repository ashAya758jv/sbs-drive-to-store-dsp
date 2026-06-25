from datetime import date

from pydantic import BaseModel, ConfigDict


class StatisticRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    campaign_id: int
    store_id: int | None = None
    date: date
    impressions: int
    clicks: int
    spend: float
