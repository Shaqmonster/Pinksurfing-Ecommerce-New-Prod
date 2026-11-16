// Shared parsing for business-for-sale numbers, so category cards show the same figures
// as the listing detail page.

// Attribute names vendors' listings use for each figure (matched case-insensitively,
// underscores treated as spaces). Keep in sync with ProductDetailPage.
export const REVENUE_ATTR_ALIASES = ["annual revenue", "revenue", "revenue ($)", "annual_revenue"];
export const EBITDA_ATTR_ALIASES = [
  "ebitda",
  "ebitda ($)",
  "normalized ebitda",
  "adjusted ebitda",
  "normalized/adjusted ebitda",
  "sde",
  "sde ($)",
];

// "$80,000" / "80000" / 80000 -> 80000. Anything unparseable -> null.
export const parseMoney = (v) => {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

// Asking price / EBITDA, or an explicit multiple if the vendor entered one.
// Returns a display string like "3.2" or null when it cannot be computed honestly.
export const ebitdaMultiple = ({ explicit, asking, ebitda }) => {
  const given = parseMoney(explicit);
  if (given !== null && given > 0) return given.toFixed(1);
  if (asking > 0 && ebitda > 0) return (asking / ebitda).toFixed(1);
  return null;
};
