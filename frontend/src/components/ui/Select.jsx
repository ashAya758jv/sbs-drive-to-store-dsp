import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

/**
 * Styled wrapper around a native <select>.
 *
 * `options` accepts either plain strings (`["A", "B"]`) or
 * `{ value, label }` objects, so it works for both simple filters and the
 * role selector.
 */
export default function Select({
  label,
  id,
  value,
  onChange,
  options = [],
  className,
  selectClassName,
  ...props
}) {
  const normalized = options.map((opt) =>
    typeof opt === "object" ? opt : { value: opt, label: opt },
  );

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-slate-500">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={cn(
            "w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white transition-colors",
            "py-2 pl-3 pr-9 text-sm text-slate-700 shadow-sm",
            "hover:border-slate-300",
            "focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30",
            selectClassName,
          )}
          {...props}
        >
          {normalized.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}
