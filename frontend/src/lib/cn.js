/**
 * Tiny classNames helper — joins truthy class fragments with a space.
 * Keeps component markup readable without pulling in an extra dependency.
 */
export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}
