from fastapi import APIRouter

from app.schemas.user import UserRead
from app.services import users_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
def list_users():
    return users_service.list_users()
