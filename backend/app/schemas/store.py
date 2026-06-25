from pydantic import BaseModel, ConfigDict


class StoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    advertiser_id: int
    name: str
    city: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    opening_hours: str | None = None
    store_url: str | None = None
