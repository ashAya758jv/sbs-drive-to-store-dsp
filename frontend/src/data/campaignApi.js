/**
 * Campaign-creation data layer.
 *
 * Wraps the backend endpoints used by the wizard and always degrades
 * gracefully so the flow stays testable end to end even without the API
 * running:
 *   - options fall back to a local catalog (kept in sync with the backend);
 *   - draft creation falls back to `localStorage`.
 */
import { apiGet, apiPost } from "../lib/api";

const DRAFTS_KEY = "sbs_dsp_drafts";

/* ------------------------------------------------------------------ */
/*  Local fallback option catalog (mirrors backend campaign_options)   */
/* ------------------------------------------------------------------ */
export const FALLBACK_OPTIONS = {
  objectives: [
    { value: "drive_to_store", label: "Drive-to-store (visite en magasin)" },
    { value: "awareness", label: "Notoriété" },
    { value: "traffic", label: "Trafic" },
    { value: "conversions", label: "Conversions" },
  ],
  advertisers: [
    { value: 1, label: "Marjane" },
    { value: 2, label: "Carrefour" },
    { value: 3, label: "BIM" },
    { value: 4, label: "CIH Bank" },
  ],
  devices: [
    { value: "mobile", label: "Mobile" },
    { value: "desktop", label: "Desktop" },
    { value: "tablet", label: "Tablette" },
  ],
  operating_systems: [
    { value: "android", label: "Android" },
    { value: "ios", label: "iOS" },
    { value: "windows", label: "Windows" },
    { value: "macos", label: "macOS" },
  ],
  time_ranges: [
    { value: "morning", label: "Matin (06h – 12h)" },
    { value: "afternoon", label: "Après-midi (12h – 18h)" },
    { value: "evening", label: "Soirée (18h – 00h)" },
    { value: "night", label: "Nuit (00h – 06h)" },
  ],
  formats: [
    {
      value: "banner",
      label: "Bannière",
      description:
        "Format classique affiché en haut ou en bas de l'écran (ex. 320×50).",
    },
    {
      value: "rectangle",
      label: "Pavé",
      description:
        "Pavé rectangulaire intégré au contenu de l'application (ex. 300×250).",
    },
    {
      value: "interstitial",
      label: "Interstitiel",
      description:
        "Publicité plein écran affichée entre deux écrans de l'application.",
    },
  ],
  app_categories: [
    { value: "news", label: "Actualités" },
    { value: "shopping", label: "Shopping & e-commerce" },
    { value: "food", label: "Food & restauration" },
    { value: "lifestyle", label: "Lifestyle & bien-être" },
    { value: "sports", label: "Sport" },
    { value: "travel", label: "Voyage" },
    { value: "finance", label: "Finance" },
    { value: "games", label: "Jeux" },
  ],
};

/* ------------------------------------------------------------------ */
/*  API calls (with graceful fallbacks)                                */
/* ------------------------------------------------------------------ */
export async function getCampaignOptions() {
  try {
    return await apiGet("/campaign-creation/options");
  } catch {
    return FALLBACK_OPTIONS;
  }
}

function readLocalDrafts() {
  try {
    return JSON.parse(localStorage.getItem(DRAFTS_KEY)) || [];
  } catch {
    return [];
  }
}

function writeLocalDrafts(drafts) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

/**
 * Persist a draft. Tries the backend first; on failure, stores it locally so
 * the wizard still completes and the draft shows up in the campaigns list.
 * Returns `{ ...draft, _source: "api" | "local" }`.
 */
export async function createDraft(payload) {
  try {
    const saved = await apiPost("/campaigns/drafts", payload);
    return { ...saved, _source: "api" };
  } catch {
    const draft = {
      ...payload,
      id: Date.now(),
      status: "draft",
      created_at: new Date().toISOString(),
      _source: "local",
    };
    writeLocalDrafts([draft, ...readLocalDrafts()]);
    return draft;
  }
}

export async function getDrafts() {
  try {
    return await apiGet("/campaigns/drafts");
  } catch {
    return readLocalDrafts();
  }
}

export async function getDraft(draftId) {
  try {
    return await apiGet(`/campaigns/drafts/${draftId}`);
  } catch {
    return (
      readLocalDrafts().find((d) => String(d.id) === String(draftId)) || null
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Estimated impressions (client-side, deterministic)                 */
/* ------------------------------------------------------------------ */
/**
 * Rough impression estimate driven by budget and targeting breadth.
 * Purely indicative — gives the wizard a live counter to react to.
 */
export function estimateImpressions(form) {
  const budget = Number(form.total_budget) || 0;
  if (budget <= 0) return 0;

  const CPM = 22; // MAD for 1000 impressions
  let reach = 1;
  reach *= form.devices.length
    ? 0.5 + 0.17 * Math.min(form.devices.length, 3)
    : 0.3;
  reach *= form.operating_systems.length
    ? 0.6 + 0.1 * Math.min(form.operating_systems.length, 4)
    : 0.4;
  reach *= form.app_categories.length
    ? Math.min(1, 0.4 + 0.12 * form.app_categories.length)
    : 0.5;
  if (form.exclude_games) reach *= 0.9;

  return Math.round((budget / CPM) * 1000 * reach);
}
