from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas.dco import DcoAssetRead
from app.services import dco_service
from app.services.dco_service import DcoUploadError

router = APIRouter(prefix="/dco", tags=["dco"])


@router.post("/creatives", response_model=DcoAssetRead, status_code=201)
async def upload_creative(
    file: UploadFile = File(...),
    format: str = Form(...),
    advertiser_id: int = Form(...),
):
    """Register a DCO creative upload.

    Jour 1: metadata only (filename, content type, size) is recorded
    in-memory — no file is written to disk and no PostgreSQL is required.
    """
    content = await file.read()
    try:
        return dco_service.register_upload(
            advertiser_id=advertiser_id,
            format=format,
            filename=file.filename or "",
            content_type=file.content_type or "",
            size_bytes=len(content),
        )
    except DcoUploadError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/creatives", response_model=list[DcoAssetRead])
def list_creatives(advertiser_id: int | None = None):
    return dco_service.list_uploads(advertiser_id)
