/**
 * Format a numeric amount for display as USD-style currency (2 decimal places).
 * Uses cent rounding so floating-point artifacts (e.g. 25.990000000000002) do not appear.
 *
 * @param {unknown} value - Raw number, string, or nullish from API
 * @returns {string} e.g. "25.99"
 */
export function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n) || !Number.isFinite(n)) return "0.00";
  return (Math.round(n * 100) / 100).toFixed(2);
}
