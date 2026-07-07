/**
 * Stores data layer — client DB import.
 *
 * Sends the uploaded file (.xlsx / .csv) to the backend for parsing and
 * validation, and returns the import preview (counts, valid stores, row
 * errors). Requires the FastAPI backend to be running: unlike the campaign
 * wizard there is no offline fallback, because the parsing happens server-side.
 */
import { apiUpload } from "../lib/api";

/** Expected header columns, also shown as a hint in the UI. */
export const EXPECTED_COLUMNS = [
  "store_id",
  "name",
  "city",
  "address",
  "latitude",
  "longitude",
  "opening_hours",
  "store_url",
];

export async function previewStoreImport(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload("/stores/import/preview", formData);
}
