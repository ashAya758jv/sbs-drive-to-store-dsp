import { Check } from "lucide-react";
import { cn } from "../../lib/cn";

/**
 * Horizontal stepper for the campaign wizard.
 *
 * @param {{ id: string, label: string }[]} steps
 * @param {number} current  index of the active step
 * @param {(index:number)=>void} [onStepSelect]  allows jumping back to a
 *        already-reached step (indices <= current).
 */
export default function Stepper({ steps, current, onStepSelect }) {
  return (
    <ol className="flex items-center">
      {steps.map((step, index) => {
        const isDone = index < current;
        const isActive = index === current;
        const clickable =
          index <= current && typeof onStepSelect === "function";

        return (
          <li
            key={step.id}
            className={cn(
              "flex items-center",
              index < steps.length - 1 && "flex-1",
            )}
          >
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepSelect(index)}
              className={cn(
                "flex items-center gap-3 text-left",
                clickable ? "cursor-pointer" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-semibold transition-colors",
                  isActive
                    ? "border-primary-600 bg-primary-600 text-white"
                    : isDone
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-slate-300 bg-white text-slate-400",
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span className="hidden sm:block">
                <span className="block text-[11px] uppercase tracking-wide text-slate-400">
                  Étape {index + 1}
                </span>
                <span
                  className={cn(
                    "block text-sm font-medium",
                    isActive || isDone ? "text-slate-800" : "text-slate-400",
                  )}
                >
                  {step.label}
                </span>
              </span>
            </button>

            {index < steps.length - 1 && (
              <span
                className={cn(
                  "mx-3 h-px flex-1 rounded",
                  isDone ? "bg-primary-300" : "bg-slate-200",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
