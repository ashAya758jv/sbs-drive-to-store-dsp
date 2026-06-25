from pydantic import BaseModel, ConfigDict

from app.core.enums import CreativeFormat


class CreativeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    campaign_id: int
    format: CreativeFormat
    image_url: str | None = None
    promotion_text: str | None = None
