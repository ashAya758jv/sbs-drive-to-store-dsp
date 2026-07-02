import { cn } from "../../lib/cn";

/**
 * Form field wrapper: label (with optional required marker), the control
 * (children), and a slot below for either an error message or a hint.
 */
export default function Field({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  className,
  children,
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-xs font-medium text-slate-500">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
