from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.store_import import StoreImportPreview
from app.services import store_import_service
from app.services.store_import_service import StoreImportError

router = APIRouter(prefix="/stores/import", tags=["stores-import"])


@router.post("/preview", response_model=StoreImportPreview)
async def preview_store_import(file: UploadFile = File(...)):
    """Parse and validate a client store file (.xlsx or .csv).

    Returns the import preview: row counts, the valid stores, and one explicit
    error per invalid cell (with its file row number). Nothing is persisted.
    """
    content = await file.read()
    try:
        return store_import_service.build_preview(file.filename or "", content)
    except StoreImportError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
