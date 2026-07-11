from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

#: Simple mock status (not a strict enum — Semaine 6, kept lightweight/in-memory).
ADVERTISER_STATUSES = {"active", "inactive"}


class AdvertiserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sector: str | None = None
    contact_name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    city: str | None = None
    website: str | None = None
    status: str = "active"
    campaigns_count: int = 0
    stores_count: int = 0


class AdvertiserUpdate(BaseModel):
    """All fields optional — only the ones sent are updated (PATCH semantics)."""

    name: str | None = None
    sector: str | None = None
    contact_name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    city: str | None = None
    website: str | None = None
    status: str | None = None

    @field_validator("name")
    @classmethod
    def _name_not_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Le nom ne peut pas être vide.")
        return value.strip() if value is not None else value

    @field_validator("status")
    @classmethod
    def _status_valid(cls, value: str | None) -> str | None:
        if value is not None and value not in ADVERTISER_STATUSES:
            raise ValueError(
                f"Statut invalide : {value} (attendu : active ou inactive)."
            )
        return value
