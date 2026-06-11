/** Display name for header / profile — prefers full name, then email local-part. */
export function getCustomerDisplayName(user) {
  if (!user) return "Account";
  const full = [user.first_name, user.last_name]
    .filter((part) => part && String(part).trim())
    .join(" ")
    .trim();
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
