import axios from "axios";
import { getCookie, getSharedAuthCookieDomain } from "./cookie";

const LOGOUT_GUARD_KEY = "ps_sso_logout_at";
const AUTH_REFRESH_URL = "https://auth.pinksurfing.com/api/token/refresh/";
const AUTH_LOGOUT_URL = "https://auth.pinksurfing.com/api/logout/";

export function markSsoLoggedOut() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LOGOUT_GUARD_KEY, String(Date.now()));
}

export function clearSsoLogoutGuard() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LOGOUT_GUARD_KEY);
}

export function shouldSkipSsoBootstrap() {
  if (typeof window === "undefined") return false;
  const raw = sessionStorage.getItem(LOGOUT_GUARD_KEY);
  if (!raw) return false;
  if (Date.now() - Number(raw) > 5 * 60 * 1000) {
    sessionStorage.removeItem(LOGOUT_GUARD_KEY);
    return false;
  }
  return true;
}

export function getJwtUserId(token) {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    const json = JSON.parse(
      atob(part.replace(/-/g, "+").replace(/_/g, "/"))
    );
    const id = json.user_id ?? json.sub;
    return id != null ? String(id) : null;
  } catch {
    return null;
  }
}

/** Readable cookie only (not localStorage). */
export function getReadableAccessCookie() {
  return getCookie("access_token");
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return (
    getReadableAccessCookie() ||
    localStorage.getItem("access_token") ||
    null
  );
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return (
    getCookie("refresh_token") ||
    localStorage.getItem("refresh_token") ||
    null
  );
}

function writeCookie(name, value, maxAgeSeconds, domain) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const encoded = encodeURIComponent(value || "");
  const domainPart = domain ? `; domain=${domain}` : "";
  document.cookie = `${name}=${encoded}; path=/${domainPart}; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

/** Mirror tokens to .pinksurfing.com so vendor + storefront both see the session. */
export function persistAuthSession(access, refresh) {
  if (typeof window === "undefined" || !access) return;

  clearSsoLogoutGuard();
  localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);

  const sharedDomain = getSharedAuthCookieDomain();
  writeCookie("access_token", access, 60 * 60, undefined);
  if (refresh) writeCookie("refresh_token", refresh, 7 * 24 * 60 * 60, undefined);
  if (sharedDomain) {
    writeCookie("access_token", access, 60 * 60, sharedDomain);
    if (refresh) writeCookie("refresh_token", refresh, 7 * 24 * 60 * 60, sharedDomain);
  }
}

/** Sync react-cookie state after persistAuthSession (optional). */
export function syncReactAuthCookies(access, refresh, setCookie) {
  if (!setCookie || !access) return;
  const sharedDomain = getSharedAuthCookieDomain();
  const opts = {
    path: "/",
    secure: window.location.protocol === "https:",
    sameSite: "lax",
    ...(sharedDomain ? { domain: sharedDomain } : {}),
  };
  setCookie("access_token", access, {
    ...opts,
    expires: new Date(Date.now() + 60 * 60 * 1000),
  });
  if (refresh) {
    setCookie("refresh_token", refresh, {
      ...opts,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }
}

/**
 * Exchange shared HttpOnly refresh cookie (from login on any *.pinksurfing.com app).
 */
export async function bootstrapAccessFromSsoCookies() {
  if (shouldSkipSsoBootstrap()) return null;
  try {
    const response = await axios.post(AUTH_REFRESH_URL, {}, { withCredentials: true });
    const access = response.data?.access;
    if (!access) return null;
    return { access, refresh: response.data?.refresh };
  } catch {
    return null;
  }
}

/**
 * Single source of truth: shared HttpOnly SSO cookies first, then local cache.
 * Prevents stale per-site localStorage from showing a different user.
 */
export async function resolveSharedSession() {
  if (shouldSkipSsoBootstrap()) return null;

  const previous = getAccessToken();
  const boot = await bootstrapAccessFromSsoCookies();

  if (boot?.access) {
    const prevUid = getJwtUserId(previous);
    const bootUid = getJwtUserId(boot.access);
    if (previous && prevUid && bootUid && prevUid !== bootUid) {
      clearAuthStorage();
    }
    persistAuthSession(boot.access, boot.refresh);
    return boot;
  }

  const cookieAccess = getReadableAccessCookie();
  if (cookieAccess) {
    return { access: cookieAccess, refresh: getRefreshToken() || undefined };
  }

  const stored = localStorage.getItem("access_token");
  if (stored) {
    return { access: stored, refresh: getRefreshToken() || undefined };
  }

  return null;
}

export async function refreshAccessToken() {
  const refresh = getRefreshToken();
  const response = await axios.post(
    AUTH_REFRESH_URL,
    refresh ? { refresh } : {},
    { withCredentials: true, headers: { "Content-Type": "application/json" } }
  );
  const access = response.data?.access;
  if (!access) throw new Error("No access token in refresh response");
  persistAuthSession(access, response.data?.refresh ?? refresh);
  return access;
}

export async function signOut(accessToken) {
  markSsoLoggedOut();
  const refresh = getRefreshToken();
  try {
    await axios.post(
      AUTH_LOGOUT_URL,
      refresh ? { refresh } : {},
      {
        withCredentials: true,
        headers: accessToken
          ? { Authorization: `Bearer ${String(accessToken).replaceAll('"', "")}` }
          : {},
      }
    );
  } catch (error) {
    console.error("Auth logout failed (clearing client session anyway):", error);
  }
  clearAuthStorage();
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  ["access_token", "refresh_token", "user_id"].forEach((k) =>
    localStorage.removeItem(k)
  );
  const sharedDomain = getSharedAuthCookieDomain();
  const names = ["access_token", "refresh_token", "user_id"];
  names.forEach((n) => {
    writeCookie(n, "", 0, undefined);
    if (sharedDomain) writeCookie(n, "", 0, sharedDomain);
  });
}
