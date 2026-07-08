/**
 * DCO creative upload data layer (Semaine 5, Jour 1).
 *
 * Uploads a creative image for a given ad-slot format (banner / rectangle /
 * interstitial) to the backend, which records its metadata in-memory (no
 * disk storage, no PostgreSQL required yet). The visual preview itself is
 * handled entirely client-side via an object URL — the backend is only
 * involved to validate and register the upload.
 */
import { apiGet, apiUpload } from "../lib/api";

/** Accepted image MIME types for a creative visual. */
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Human-readable list, e.g. for error messages and hints. */
export const ACCEPTED_EXTENSIONS_LABEL = "PNG, JPG/JPEG ou WEBP";

export function isAcceptedImage(file) {
  return Boolean(file) && ACCEPTED_IMAGE_TYPES.includes(file.type);
}

export async function uploadCreative({ file, format, advertiserId }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("format", format);
  formData.append("advertiser_id", String(advertiserId));
  return apiUpload("/dco/creatives", formData);
}

export async function listCreatives(advertiserId) {
  const query = advertiserId ? `?advertiser_id=${advertiserId}` : "";
  return apiGet(`/dco/creatives${query}`);
}
