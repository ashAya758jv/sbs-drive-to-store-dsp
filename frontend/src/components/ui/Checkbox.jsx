import { Check } from "lucide-react";
import { cn } from "../../lib/cn";

/**
 * Selectable checkbox rendered as a bordered card (highlighted in violet when
 * checked). Works for a simple label or a label + description. The native input
 * is visually hidden but kept for accessibility.
 */
export default function Checkbox({
  checked,
  onChange,
  label,
  description,
  className,
  disabled = false,
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 transition-colors",
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
          : cn(
              "cursor-pointer focus-within:ring-2 focus-within:ring-primary-500/30",
              checked
                ? "border-primary-300 bg-primary-50/60 ring-1 ring-primary-500/20"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
            ),
        className,
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
          checked
            ? "border-primary-600 bg-primary-600 text-white"
            : "border-slate-300 bg-white",
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" />}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
