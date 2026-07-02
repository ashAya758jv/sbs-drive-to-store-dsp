/** Add/remove a value from an array (used by the checkbox groups). */
export function toggleValue(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
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
