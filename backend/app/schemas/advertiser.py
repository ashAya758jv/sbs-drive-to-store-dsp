from pydantic import BaseModel, ConfigDict, EmailStr


class AdvertiserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sector: str | None = None
    contact_name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
