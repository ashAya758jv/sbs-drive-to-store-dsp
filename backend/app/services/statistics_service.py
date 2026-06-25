"""Statistics & dashboard aggregation.

Returns mock data today; will aggregate real ``Statistic`` rows once the
database is wired.
"""
from app.services import mock_data


def get_dashboard() -> dict:
    return {
        "kpis": mock_data.DASHBOARD_KPIS,
        "recent_campaigns": mock_data.DASHBOARD_RECENT_CAMPAIGNS,
        "performance": mock_data.DASHBOARD_PERFORMANCE,
    }
