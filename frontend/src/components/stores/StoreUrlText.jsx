import { cn } from "../../lib/cn";

/**
 * A store URL rendered as plain, NON-clickable text.
 *
 * Store URLs (`store_url`) come from mock / demo data (e.g.
 * `https://www.marjane.ma/...`) that 404 in real life, so they must never be
 * real links. This is deliberately a `<span>` with **no** `href`, `onClick`,
 * `target`, or `window.open` — the URL stays visible (and selectable) as
 * information only and can never trigger navigation.
 *
 * `className` is merged so callers can pick the layout (e.g. `truncate` in a
 * compact card vs. `break-all` in a wider block).
 */
export default function StoreUrlText({ url, className }) {
  if (!url) {
    return <span className={cn("text-slate-400", className)}>URL non disponible</span>;
  }
  return (
    <span
      className={cn("cursor-default select-text text-violet-600", className)}
      title={url}
    >
      {url}
    </span>
  );
}
