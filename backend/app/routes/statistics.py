from fastapi import APIRouter

from app.schemas.dashboard import DashboardResponse
from app.services import statistics_service

router = APIRouter(prefix="/statistics", tags=["statistics"])


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard():
    """Aggregated KPIs, recent campaigns and performance series for the home dashboard."""
    return statistics_service.get_dashboard()
