/** Prefer the most complete non-empty name fragment (avoids "S" from bad JWT fallbacks). */
export function pickBestNamePart(...candidates) {
  const parts = candidates
    .map((value) => (value && String(value).trim()) || "")
    .filter(Boolean);
  const substantial = parts.find((part) => part.length >= 2);
  return substantial || parts[0] || "";
}

/** Display name for header / profile — prefers full name, then email local-part. */
export function getCustomerDisplayName(user) {
  if (!user) return "Account";
  const first = pickBestNamePart(user.first_name);
  const last = pickBestNamePart(user.last_name);
  const full = [first, last].filter(Boolean).join(" ").trim();
  if (full) return full;
  const email = user.email || user.customer_email || "";
  if (email.includes("@")) return email.split("@")[0];
  return "Account";
}

export function getJoinedYear(dateRegistered) {
  if (!dateRegistered) return null;
  const year = new Date(dateRegistered).getFullYear();
  return Number.isFinite(year) ? year : null;
}
