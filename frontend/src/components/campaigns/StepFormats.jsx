import Checkbox from "../ui/Checkbox";
import { toggleValue } from "./helpers";

/**
 * Step 3 — advertising formats. Each format shows a short description; at least
 * one must be selected (validation handled by the wizard).
 */
export default function StepFormats({ form, update, errors, options }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-sm font-medium text-slate-700">
          Formats publicitaires<span className="ml-0.5 text-rose-500">*</span>
        </p>
        {errors.formats && (
          <span className="text-xs font-medium text-rose-600">{errors.formats}</span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {options.formats.map((format) => (
          <Checkbox
            key={format.value}
            label={format.label}
            description={format.description}
            checked={form.formats.includes(format.value)}
            onChange={() =>
              update({ formats: toggleValue(form.formats, format.value) })
            }
          />
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Sélectionnez au moins un format. Vous pourrez ajouter les visuels
        correspondants dans le module Créations / DCO.
      </p>
    </div>
  );
}
