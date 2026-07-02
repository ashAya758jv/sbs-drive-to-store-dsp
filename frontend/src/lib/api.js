/**
 * Minimal fetch helper for the FastAPI backend.
 *
 * The base URL defaults to the local dev server and can be overridden at build
 * time with `VITE_API_URL`. Callers are expected to handle failures (the app
 * still runs on mock data / local fallbacks when the API is offline).
 */
const API_BASE = (
  import.meta.env?.VITE_API_URL || "http://localhost:8000/api"
).replace(/\/$/, "");

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}

export { API_BASE };
