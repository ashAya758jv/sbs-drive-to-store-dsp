import Checkbox from "../ui/Checkbox";
import { compatibleOsValues, toggleValue } from "./helpers";

/** A labeled group of checkboxes bound to one array field of the form. */
function CheckboxGroup({
  title,
  required,
  error,
  hint,
  options,
  selected,
  onToggle,
  columns,
  isDisabled,
}) {
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
        {options.map((opt) => {
          const disabled =
            typeof isDisabled === "function" ? isDisabled(opt.value) : false;
          return (
            <Checkbox
              key={opt.value}
              label={opt.label}
              checked={selected.includes(opt.value)}
              disabled={disabled}
              onChange={() => {
                if (!disabled) onToggle(opt.value);
              }}
            />
          );
        })}
      </div>
      {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/**
 * Step 2 — technical targeting: devices, operating systems, time ranges.
 *
 * Devices and OS are linked: Mobile / Tablette only allow Android or iOS,
 * Desktop only allows Windows or macOS. Incompatible OS are disabled, and any
 * selected OS that becomes incompatible after a device change is removed.
 */
export default function StepTargeting({ form, update, errors, options }) {
  const allowedOs = compatibleOsValues(form.devices);
  const noDevice = form.devices.length === 0;

  const handleDeviceToggle = (value) => {
    const nextDevices = toggleValue(form.devices, value);
    const nextAllowed = compatibleOsValues(nextDevices);
    // Rule: drop any OS no longer compatible with the new device selection.
    const prunedOs = form.operating_systems.filter((os) =>
      nextAllowed.includes(os),
    );
    update({ devices: nextDevices, operating_systems: prunedOs });
  };

  const osHint = noDevice
    ? "Choisissez d'abord un appareil pour activer les systèmes compatibles."
    : "Compatibilité : Mobile / Tablette → Android, iOS · Desktop → Windows, macOS.";

  return (
    <div className="space-y-6">
      <CheckboxGroup
        title="Appareils (devices)"
        required
        error={errors.devices}
        options={options.devices}
        selected={form.devices}
        onToggle={handleDeviceToggle}
        columns="sm:grid-cols-3"
      />

      <CheckboxGroup
        title="Systèmes d'exploitation"
        required
        error={errors.operating_systems}
        hint={osHint}
        options={options.operating_systems}
        selected={form.operating_systems}
        onToggle={(value) =>
          update({ operating_systems: toggleValue(form.operating_systems, value) })
        }
        columns="sm:grid-cols-2 lg:grid-cols-4"
        isDisabled={(os) => noDevice || !allowedOs.includes(os)}
      />

      <CheckboxGroup
        title="Plages horaires de diffusion"
        error={errors.time_ranges}
        hint="Les plages horaires sont optionnelles : sans sélection, la campagne diffuse toute la journée."
        options={options.time_ranges}
        selected={form.time_ranges}
        onToggle={(value) =>
          update({ time_ranges: toggleValue(form.time_ranges, value) })
        }
        columns="sm:grid-cols-2 lg:grid-cols-4"
      />
    </div>
  );
}
