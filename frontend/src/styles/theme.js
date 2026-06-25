/**
 * Shared design tokens exposed to JavaScript.
 *
 * Tailwind handles styling through utility classes, but libraries such as
 * Recharts need real color values. Keep those values centralized here so the
 * charts stay in sync with the CSS theme defined in `index.css`.
 */
export const brand = {
  primary: "#6a3ad8",
  primaryLight: "#9b78f0",
  primarySoft: "#f4f1fe",
};

export const chartColors = {
  impressions: "#6a3ad8",
  clics: "#0ea5e9",
  grid: "#eef2f7",
  axis: "#94a3b8",
};
