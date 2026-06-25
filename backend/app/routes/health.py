from fastapi import APIRouter

from app.core.config import settings
from app.schemas.common import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Liveness probe."""
    return HealthResponse(
        status="ok", service=settings.PROJECT_NAME, version=settings.VERSION
    )
