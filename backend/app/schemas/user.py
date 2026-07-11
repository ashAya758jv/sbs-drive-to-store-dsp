from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.core.enums import UserRole, UserStatus


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    advertiser_id: int | None = None
    advertiser_name: str | None = None
    last_login: datetime | None = None


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    role: UserRole
    advertiser_id: int | None = None

    @field_validator("name")
    @classmethod
    def _name_not_blank(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Le nom est obligatoire.")
        return value.strip()


class UserUpdate(BaseModel):
    """All fields optional — only the ones sent are updated (PATCH semantics)."""

    name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None
    advertiser_id: int | None = None

    @field_validator("name")
    @classmethod
    def _name_not_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Le nom ne peut pas être vide.")
        return value.strip() if value is not None else value


class UserStatusUpdate(BaseModel):
    status: UserStatus
