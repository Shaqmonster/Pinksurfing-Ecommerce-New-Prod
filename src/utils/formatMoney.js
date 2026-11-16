const MONEY_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a numeric amount for display as USD-style currency (2 decimal places, thousands
 * separators). Uses cent rounding so floating-point artifacts (e.g. 25.990000000000002) do
 * not appear. Display only: never parse the result back into a number.
 *
 * @param {unknown} value - Raw number, string, or nullish from API
 * @returns {string} e.g. "25.99", "320,000.00"
 */
export function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n) || !Number.isFinite(n)) return "0.00";
  return MONEY_FORMAT.format(Math.round(n * 100) / 100);
}
