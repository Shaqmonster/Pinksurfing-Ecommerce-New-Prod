/**
 * Central place for environment-aware URLs.
 * Set VITE_ENV=production in .env for the live deployment.
 */
const isProd = import.meta.env.VITE_ENV === "production";

/** Pinksurfing customer storefront base URL */
export const STOREFRONT_BASE = isProd
  ? "https://pinksurfing.com"
  : "https://dev.pinksurfing.com";

/** Pinksurfing vendor portal base URL */
export const VENDOR_PORTAL_BASE = isProd
  ? "https://vendors.pinksurfing.com"
  : "https://dev-vendors.pinksurfing.com";

/** Build a store link for a given slug */
export const storeUrl = (slug) => `${STOREFRONT_BASE}/store/${slug}`;
