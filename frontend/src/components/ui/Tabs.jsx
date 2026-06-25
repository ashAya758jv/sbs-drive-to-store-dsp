import { cn } from "../../lib/cn";

/**
 * Horizontal tab bar. Purely presentational — the caller owns the active
 * tab's state and decides what to render below.
 *
 * `tabs` is `{ id, label, icon? }[]`.
 */
export default function Tabs({ tabs = [], value, onChange, className }) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-1 overflow-x-auto border-b border-slate-100",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 rounded-t-md px-4 py-3 text-sm font-medium transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
              isActive
                ? "text-primary-700"
                : "text-slate-500 hover:text-slate-800 active:text-slate-900",
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
            {isActive && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}
