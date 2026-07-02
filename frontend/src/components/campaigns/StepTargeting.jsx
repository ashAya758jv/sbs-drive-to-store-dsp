import Checkbox from "../ui/Checkbox";
import { toggleValue } from "./helpers";

/** A labeled group of checkboxes bound to one array field of the form. */
function CheckboxGroup({ title, required, error, options, selected, onToggle, columns }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-sm font-medium text-slate-700">
          {title}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </p>
        {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
      </div>
      <div className={`grid gap-3 ${columns}`}>
        {options.map((opt) => (
          <Checkbox
            key={opt.value}
            label={opt.label}
            checked={selected.includes(opt.value)}
            onChange={() => onToggle(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Step 2 — technical targeting: devices, operating systems, time ranges.
 */
export default function StepTargeting({ form, update, errors, options }) {
  return (
    <div className="space-y-6">
      <CheckboxGroup
        title="Appareils (devices)"
        required
        error={errors.devices}
        options={options.devices}
        selected={form.devices}
        onToggle={(value) => update({ devices: toggleValue(form.devices, value) })}
        columns="sm:grid-cols-3"
      />

      <CheckboxGroup
        title="Systèmes d'exploitation"
        required
        error={errors.operating_systems}
        options={options.operating_systems}
        selected={form.operating_systems}
        onToggle={(value) =>
          update({ operating_systems: toggleValue(form.operating_systems, value) })
        }
        columns="sm:grid-cols-2 lg:grid-cols-4"
      />

      <CheckboxGroup
        title="Plages horaires de diffusion"
        error={errors.time_ranges}
        options={options.time_ranges}
        selected={form.time_ranges}
        onToggle={(value) =>
          update({ time_ranges: toggleValue(form.time_ranges, value) })
        }
        columns="sm:grid-cols-2 lg:grid-cols-4"
      />
      <p className="text-xs text-slate-400">
        Les plages horaires sont optionnelles : sans sélection, la campagne
        diffuse toute la journée.
      </p>
    </div>
  );
}
