"""Schemas for the aggregated dashboard endpoint.

Shaped to match the frontend's mock dashboard data so the React app can consume
this endpoint with minimal changes once it is wired up.
"""
from pydantic import BaseModel


class KpiCard(BaseModel):
    id: str
    label: str
    value: str
    delta: str
    trend: str  # "up" | "down"


class CampaignSummary(BaseModel):
    id: int
    name: str
    status: str
    period: str
    budget: str
    spent: str
    impressions: str
    clics: str


class PerformancePoint(BaseModel):
    period: str
    impressions: int
    clics: int


class DashboardResponse(BaseModel):
    kpis: list[KpiCard]
    recent_campaigns: list[CampaignSummary]
    performance: list[PerformancePoint]
