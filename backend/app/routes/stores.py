from fastapi import APIRouter

from app.schemas.store import StoreRead
from app.services import stores_service

router = APIRouter(prefix="/stores", tags=["stores"])


@router.get("", response_model=list[StoreRead])
def list_stores():
    return stores_service.list_stores()
