/** Add/remove a value from an array (used by the checkbox groups). */
export function toggleValue(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/**
 * Device → compatible operating systems (business rule).
 * Mobile & Tablette run mobile OS (Android/iOS); Desktop runs desktop OS
 * (Windows/macOS). Used to keep the step-2 selections coherent.
 */
export const DEVICE_OS = {
  mobile: ["android", "ios"],
  tablet: ["android", "ios"],
  desktop: ["windows", "macos"],
};

/** OS values compatible with the selected devices (union across devices). */
export function compatibleOsValues(devices = []) {
  const allowed = new Set();
  devices.forEach((device) =>
    (DEVICE_OS[device] || []).forEach((os) => allowed.add(os)),
  );
  return [...allowed];
}

/** Resolve an option's French label from its value; falls back to the value. */
export function labelOf(options = [], value) {
  const found = options.find((opt) => String(opt.value) === String(value));
  return found ? found.label : value;
}

/** Map a list of values to their labels. */
export function labelsOf(options = [], values = []) {
  return values.map((value) => labelOf(options, value));
}
