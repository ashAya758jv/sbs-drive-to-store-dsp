import { cn } from "../../lib/cn";

/**
 * Styled text/number/date input, matching the Select's look. Pass `invalid`
 * to switch to the error styling (rose border + ring).
 */
export default function Input({ className, invalid = false, ...props }) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors",
        "placeholder:text-slate-400",
        "focus:outline-none focus:ring-2",
        "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
        invalid
          ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/30"
          : "border-slate-200 hover:border-slate-300 focus:border-primary-400 focus:ring-primary-500/30",
        className,
      )}
      {...props}
    />
  );
}
