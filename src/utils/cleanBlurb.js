/**
 * A one-line description is shown only when it has real text: an empty value or a stray "null" /
 * "undefined" string (saved by an older server) renders nothing instead of a literal "null".
 */
export function cleanBlurb(value) {
  const text = String(value ?? "").trim();
  const lower = text.toLowerCase();
  return !text || lower === "null" || lower === "undefined" ? "" : text;
}
