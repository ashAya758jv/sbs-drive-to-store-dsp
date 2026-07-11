from fastapi import APIRouter, HTTPException

from app.schemas.user import UserCreate, UserRead, UserStatusUpdate, UserUpdate
from app.services import users_service
from app.services.users_service import DuplicateEmailError, UserNotFoundError

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
def list_users():
    return users_service.list_users()


@router.post("", response_model=UserRead, status_code=201)
def create_user(payload: UserCreate):
    try:
        return users_service.create_user(payload.model_dump())
    except DuplicateEmailError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int):
    try:
        return users_service.get_user(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.patch("/{user_id}", response_model=UserRead)
def update_user(user_id: int, payload: UserUpdate):
    try:
        return users_service.update_user(user_id, payload.model_dump(exclude_unset=True))
    except UserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except DuplicateEmailError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.patch("/{user_id}/status", response_model=UserRead)
def set_user_status(user_id: int, payload: UserStatusUpdate):
    try:
        return users_service.set_user_status(user_id, payload.status)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
