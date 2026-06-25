from pydantic import BaseModel, ConfigDict, EmailStr

from app.core.enums import UserRole, UserStatus


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: UserRole
    status: UserStatus
