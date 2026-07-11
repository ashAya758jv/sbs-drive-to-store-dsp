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

/**
 * Reads the backend's `detail` message out of a failed JSON response, falling
 * back to a generic `METHOD path → status` message when the body isn't JSON
 * (or has no `detail`). Shared by every mutating helper below so the UI can
 * always surface a helpful error.
 */
async function readErrorDetail(res, method, path) {
  let message = `${method} ${path} → ${res.status}`;
  try {
    const data = await res.json();
    if (typeof data.detail === "string") message = data.detail;
  } catch {
    /* non-JSON error body: keep the generic message */
  }
  return message;
}

async function apiJson(method, path, body) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "API injoignable — lancez le backend (uvicorn app.main:app --reload) puis réessayez.",
    );
  }
  if (!res.ok) throw new Error(await readErrorDetail(res, method, path));
  return res.json();
}

export async function apiPost(path, body) {
  return apiJson("POST", path, body);
}

/** PATCH a JSON payload (partial update) — mirrors `apiPost`. */
export async function apiPatch(path, body) {
  return apiJson("PATCH", path, body);
}

/**
 * POST a FormData payload (file uploads). The browser sets the multipart
 * boundary itself, so no Content-Type header here. Surfaces the backend's
 * `detail` message when available so the UI can show a helpful error.
 */
export async function apiUpload(path, formData) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { method: "POST", body: formData });
  } catch {
    throw new Error(
      "API injoignable — lancez le backend (uvicorn app.main:app --reload) puis réessayez.",
    );
  }
  if (!res.ok) {
    let message = `POST ${path} → ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") message = data.detail;
    } catch {
      /* non-JSON error body: keep the generic message */
    }
    throw new Error(message);
  }
  return res.json();
}

export { API_BASE };
