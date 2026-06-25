import { cn } from "../../lib/cn";

/**
 * White, rounded surface used across the app (KPIs, chart, tables, ...).
 * No built-in padding so it can wrap both padded content and edge-to-edge
 * tables — callers add `p-*` where needed.
 */
export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white border border-slate-200/70 shadow-sm shadow-slate-200/50",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
