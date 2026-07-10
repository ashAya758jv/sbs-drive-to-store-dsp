/**
 * Mock reporting dataset (Semaine 5, Jour 4).
 *
 * Generates a realistic daily time series (impressions, clics, dépense) per
 * campaign and per ville, anchored on the real current date so the "7/30
 * derniers jours" and "Ce mois" filters always make sense whenever the page
 * is opened. Everything here is computed once at module load — no backend
 * call, no persistence, consistent with "pas besoin de vraie base de données"
 * for this step.
 */

/** Campaigns available in the filter — mirrors the Dashboard's mock campaigns. */
export const REPORTING_CAMPAIGNS = [
  { value: "all", label: "Toutes les campagnes" },
  { value: "camp-1", label: "Marjane Ramadan 2026" },
  { value: "camp-2", label: "Carrefour Weekend Promo" },
  { value: "camp-3", label: "BIM Casablanca Local" },
  { value: "camp-4", label: "CIH Mobile Drive-to-Store" },
];

/** Cities each campaign's stores are located in — mirrors the mock store DB. */
const CAMPAIGN_CITIES = {
  "camp-1": ["Casablanca", "Rabat"],
  "camp-2": ["Casablanca"],
  "camp-3": ["Casablanca"],
  "camp-4": ["Rabat"],
};

/** Fallback city list (used only if GET /api/stores is unreachable). */
export const FALLBACK_CITIES = ["Casablanca", "Rabat", "Fès"];

/** Maps a store's advertiser to the mock campaign that targets it (Jour 5). */
const ADVERTISER_TO_CAMPAIGN = {
  1: "camp-1", // Marjane
  2: "camp-2", // Carrefour
  3: "camp-3", // BIM
  4: "camp-4", // CIH Bank
};

/** Fallback store list (used only if GET /api/stores is unreachable) —
 *  mirrors the backend's mock store DB exactly, so the map/table stay
 *  consistent whether the API is up or not. */
export const FALLBACK_STORES = [
  { id: 1, advertiser_id: 1, name: "Marjane Californie", city: "Casablanca", latitude: 33.5298, longitude: -7.6512 },
  { id: 2, advertiser_id: 1, name: "Marjane Hay Riad", city: "Rabat", latitude: 33.956, longitude: -6.867 },
  { id: 3, advertiser_id: 2, name: "Carrefour Anfa Place", city: "Casablanca", latitude: 33.602, longitude: -7.67 },
  { id: 4, advertiser_id: 3, name: "BIM Maârif", city: "Casablanca", latitude: 33.587, longitude: -7.633 },
  { id: 5, advertiser_id: 4, name: "CIH Bank Agdal", city: "Rabat", latitude: 33.992, longitude: -6.849 },
];

/** Diffusion radii used across the mock stores (km) — deterministic per store. */
const RADIUS_STEPS_KM = [5, 10, 15];
export function getStoreRadiusKm(storeId) {
  return RADIUS_STEPS_KM[Number(storeId) % RADIUS_STEPS_KM.length];
}

// Deterministic per-store "visit rate" (share of clicks converting into an
// estimated in-store visit). Each store is seeded independently (777 + id)
// so the value never depends on call order — only on the store's own id.
const visitRateCache = new Map();
function getVisitRate(storeId) {
  if (!visitRateCache.has(storeId)) {
    const rand = seededRandom(777 + Number(storeId));
    visitRateCache.set(storeId, 0.25 + rand() * 0.2); // ~25%–45% of clicks
  }
  return visitRateCache.get(storeId);
}

export const PERIOD_OPTIONS = [
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "month", label: "Ce mois" },
];

const DAYS_OF_HISTORY = 90;

/** Small deterministic PRNG so the mock dataset stays stable across renders. */
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

/** One row per (day, campaign, city) — the atomic unit everything is aggregated from. */
function generateDailyRows() {
  const rand = seededRandom(20260708);
  const rows = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = DAYS_OF_HISTORY - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const dateIso = isoDate(date);
    const weekday = date.getDay(); // 0 = Sunday
    const weekendBoost = weekday === 5 || weekday === 6 ? 1.15 : 1; // Fri/Sat uplift for retail

    REPORTING_CAMPAIGNS.slice(1).forEach((campaign) => {
      const cities = CAMPAIGN_CITIES[campaign.value];
      cities.forEach((city) => {
        // Smooth base trend (slow sine wave) + per-row noise, kept deterministic.
        const base = 9000 + Math.sin(offset / 9) * 2200;
        const impressions = Math.max(
          150,
          Math.round(base * weekendBoost * (0.82 + rand() * 0.36)),
        );
        const ctr = 0.006 + rand() * 0.006; // ~0.6% – 1.2%
        const clicks = Math.max(1, Math.round(impressions * ctr));
        const cpm = 16 + rand() * 6; // MAD per 1000 impressions
        const spend = Math.round(((impressions / 1000) * cpm + Number.EPSILON) * 100) / 100;

        rows.push({
          date: dateIso,
          campaignId: campaign.value,
          campaignLabel: campaign.label,
          city,
          impressions,
          clicks,
          spend,
        });
      });
    });
  }

  return rows;
}

/** Computed once at module load — the single source of truth for the page. */
export const DAILY_ROWS = generateDailyRows();

/** Inclusive [start, end] range for a period key, plus the equivalent preceding range. */
export function getPeriodRange(periodKey, today = new Date()) {
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);

  if (periodKey === "month") {
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    const daysElapsed = Math.round((end - start) / 86400000) + 1;
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - (daysElapsed - 1));
    return { start, end, prevStart, prevEnd };
  }

  const spanDays = periodKey === "7d" ? 7 : 30;
  const start = new Date(end);
  start.setDate(start.getDate() - (spanDays - 1));
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (spanDays - 1));
  return { start, end, prevStart, prevEnd };
}

function inRange(dateIso, start, end) {
  return dateIso >= isoDate(start) && dateIso <= isoDate(end);
}

/** Filter the raw rows by period range, campaign and city ("all" = no filter). */
export function filterRows(rows, { start, end, campaignId, city }) {
  return rows.filter((row) => {
    if (!inRange(row.date, start, end)) return false;
    if (campaignId && campaignId !== "all" && row.campaignId !== campaignId) return false;
    if (city && city !== "all" && row.city !== city) return false;
    return true;
  });
}

/** Sum impressions/clicks/spend across a set of rows. */
export function sumRows(rows) {
  return rows.reduce(
    (acc, row) => ({
      impressions: acc.impressions + row.impressions,
      clicks: acc.clicks + row.clicks,
      spend: acc.spend + row.spend,
    }),
    { impressions: 0, clicks: 0, spend: 0 },
  );
}

/** Aggregate rows into one entry per day, sorted chronologically (for the trend chart). */
export function toDailySeries(rows) {
  const byDate = new Map();
  rows.forEach((row) => {
    const entry = byDate.get(row.date) ?? { date: row.date, impressions: 0, clicks: 0 };
    entry.impressions += row.impressions;
    entry.clicks += row.clicks;
    byDate.set(row.date, entry);
  });
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Aggregate rows by a given key ("campaignLabel" or "city") for the bar chart / insights. */
export function groupByKey(rows, key) {
  const groups = new Map();
  rows.forEach((row) => {
    const label = row[key];
    const entry = groups.get(label) ?? { label, impressions: 0, clicks: 0, spend: 0 };
    entry.impressions += row.impressions;
    entry.clicks += row.clicks;
    entry.spend += row.spend;
    groups.set(label, entry);
  });
  return [...groups.values()].sort((a, b) => b.impressions - a.impressions);
}

/** "08 juil." — short French date label for chart ticks / tooltips. */
export function formatShortDate(dateIso) {
  const date = new Date(`${dateIso}T00:00:00`);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/**
 * Build one row per store (Jour 5 — map + detailed table) by attributing the
 * already period/campaign/city-filtered daily rows to the single store that
 * matches each (campaign, city) pair. This reuses the exact same filtered
 * dataset as the KPIs/charts above, so the map and table always stay
 * consistent with the rest of the page's active filters.
 */
export function buildStoreRows(filteredRows, stores) {
  return stores
    .map((store) => {
      const campaignId = ADVERTISER_TO_CAMPAIGN[store.advertiser_id];
      if (!campaignId) return null;

      const rowsForStore = filteredRows.filter(
        (row) => row.campaignId === campaignId && row.city === store.city,
      );
      if (rowsForStore.length === 0) return null;

      const totals = sumRows(rowsForStore);
      const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
      const campaign = REPORTING_CAMPAIGNS.find((c) => c.value === campaignId);

      return {
        storeId: store.id,
        storeName: store.name,
        city: store.city,
        latitude: store.latitude,
        longitude: store.longitude,
        campaignId,
        campaignLabel: campaign?.label ?? campaignId,
        radiusKm: getStoreRadiusKm(store.id),
        impressions: totals.impressions,
        clicks: totals.clicks,
        ctr,
        spend: totals.spend,
        visits: Math.round(totals.clicks * getVisitRate(store.id)),
      };
    })
    .filter(Boolean);
}
