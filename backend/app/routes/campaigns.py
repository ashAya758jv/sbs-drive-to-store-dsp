from fastapi import APIRouter, HTTPException

from app.schemas.campaign import CampaignRead
from app.schemas.campaign_draft import DraftCreate, DraftRead
from app.services import campaigns_service

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("", response_model=list[CampaignRead])
def list_campaigns():
    return campaigns_service.list_campaigns()


@router.post("/drafts", response_model=DraftRead, status_code=201)
def create_draft(payload: DraftCreate):
    """Save the multi-step campaign form as a draft (status ``draft``)."""
    return campaigns_service.create_draft(payload)


@router.get("/drafts", response_model=list[DraftRead])
def list_drafts():
    return campaigns_service.list_drafts()


@router.get("/drafts/{draft_id}", response_model=DraftRead)
def get_draft(draft_id: int):
    draft = campaigns_service.get_draft(draft_id)
    if draft is None:
        raise HTTPException(status_code=404, detail="Brouillon introuvable")
    return draft
