"""In-memory registry of DCO creative uploads (Semaine 5, Jour 1).

Files are not written to disk — only their metadata is recorded, mirroring
the rest of the mock backend (no PostgreSQL required yet). The registry
resets whenever the process restarts, same as ``mock_data.py``.
"""
from datetime import datetime, timezone

#: Ad-slot formats, matching the exact slugs used by the campaign wizard
#: (see ``app.services.campaign_options.FORMATS``) so a DCO asset's format
#: lines up with the ``formats`` chosen during campaign creation.
ALLOWED_FORMATS = {"banner", "rectangle", "interstitial"}
ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024


class DcoUploadError(ValueError):
    """Invalid upload (unknown format slug, unsupported file type, too large…)."""


_uploads: list[dict] = []
_next_id = 1


def register_upload(
    *,
    advertiser_id: int,
    format: str,
    filename: str,
    content_type: str,
    size_bytes: int,
) -> dict:
    """Validate and record one creative upload's metadata."""
    global _next_id

    if format not in ALLOWED_FORMATS:
        raise DcoUploadError(f"Format inconnu : {format}.")
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise DcoUploadError(
            "Type de fichier non supporté : utilisez une image PNG, JPG/JPEG ou WEBP."
        )
    if size_bytes == 0:
        raise DcoUploadError("Le fichier est vide.")
    if size_bytes > MAX_SIZE_BYTES:
        raise DcoUploadError("Fichier trop volumineux (5 Mo maximum).")

    record = {
        "id": _next_id,
        "advertiser_id": advertiser_id,
        "format": format,
        "filename": filename,
        "content_type": content_type,
        "size_bytes": size_bytes,
        "uploaded_at": datetime.now(timezone.utc),
    }
    _uploads.append(record)
    _next_id += 1
    return record


def list_uploads(advertiser_id: int | None = None) -> list[dict]:
    """Return recorded uploads, optionally filtered by advertiser."""
    if advertiser_id is None:
        return list(_uploads)
    return [upload for upload in _uploads if upload["advertiser_id"] == advertiser_id]
