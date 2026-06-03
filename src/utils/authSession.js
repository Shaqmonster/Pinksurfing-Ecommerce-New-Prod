import axios from "axios";
import { getCookie, getSharedAuthCookieDomain } from "./cookie";

const SSO_LOGOUT_COOKIE = "ps_sso_logged_out";
const SSO_EPOCH_COOKIE = "ps_sso_epoch";
const AUTH_REFRESH_URL = "https://auth.pinksurfing.com/api/token/refresh/";
const AUTH_LOGOUT_URL = "https://auth.pinksurfing.com/api/logout/";
const ACCESS_SKEW_SECONDS = 60;

let ensureSessionInflight = null;

export function decodeJwt(token) {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function isAccessTokenValid(token, skewSeconds = ACCESS_SKEW_SECONDS) {
  const payload = decodeJwt(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now() + skewSeconds * 1000;
}

export function getJwtUserId(token) {
  const payload = decodeJwt(token);
  const id = payload?.user_id ?? payload?.sub;
  return id != null ? String(id) : null;
}

function writeCookie(name, value, maxAgeSeconds, domain) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const encoded = encodeURIComponent(value || "");
  const domainPart = domain ? `; domain=${domain}` : "";
  document.cookie = `${name}=${encoded}; path=/${domainPart}; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function deleteAuthCookie(name, domain) {
  writeCookie(name, "", 0, domain);
}

export function bumpSsoEpoch() {
  if (typeof window === "undefined") return null;
  const epoch = String(Date.now());
  const sharedDomain = getSharedAuthCookieDomain();
  writeCookie(SSO_EPOCH_COOKIE, epoch, 60 * 60, undefined);
  if (sharedDomain) writeCookie(SSO_EPOCH_COOKIE, epoch, 60 * 60, sharedDomain);
  return epoch;
}

export function getSsoEpoch() {
  return getCookie(SSO_EPOCH_COOKIE);
}

export function markSsoLoggedOut() {
  if (typeof window === "undefined") return;
  const sharedDomain = getSharedAuthCookieDomain();
  writeCookie(SSO_LOGOUT_COOKIE, "1", 60 * 60, undefined);
  if (sharedDomain) writeCookie(SSO_LOGOUT_COOKIE, "1", 60 * 60, sharedDomain);
  bumpSsoEpoch();
}

export function clearSsoLoggedOutFlag() {
  if (typeof window === "undefined") return;
  const sharedDomain = getSharedAuthCookieDomain();
  deleteAuthCookie(SSO_LOGOUT_COOKIE, undefined);
  if (sharedDomain) deleteAuthCookie(SSO_LOGOUT_COOKIE, sharedDomain);
}

export function isSsoLoggedOutGlobally() {
  return getCookie(SSO_LOGOUT_COOKIE) === "1";
}

export function getCachedAccessToken() {
  if (typeof window === "undefined") return null;
  const candidates = [
    localStorage.getItem("access_token"),
    localStorage.getItem("access"),
  ].filter(Boolean);
  for (const raw of candidates) {
    const token = String(raw).replaceAll('"', "");
    if (isAccessTokenValid(token)) return token;
  }
  return null;
}

export function getAccessToken() {
  const cached = getCachedAccessToken();
  if (cached) return cached;
  const fromCookie = getCookie("access_token");
  if (fromCookie && isAccessTokenValid(fromCookie.replaceAll('"', ""))) {
    return fromCookie.replaceAll('"', "");
  }
  return null;
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("refresh_token") ||
    localStorage.getItem("refresh") ||
    getCookie("refresh_token") ||
    null
  );
}

/** Mirror tokens to .pinksurfing.com (shared) or host-only on localhost. */
export function persistAuthSession(access, refresh) {
  if (typeof window === "undefined" || !access) return;

  clearSsoLoggedOutFlag();
  localStorage.setItem("access_token", access);
  localStorage.removeItem("access");

  if (refresh) {
    localStorage.setItem("refresh_token", refresh);
    localStorage.removeItem("refresh");
  }

  const sharedDomain = getSharedAuthCookieDomain();
  if (sharedDomain) {
    writeCookie("access_token", access, 60 * 60, sharedDomain);
    if (refresh) writeCookie("refresh_token", refresh, 7 * 24 * 60 * 60, sharedDomain);
  } else {
    writeCookie("access_token", access, 60 * 60, undefined);
    if (refresh) writeCookie("refresh_token", refresh, 7 * 24 * 60 * 60, undefined);
  }

  const prevAccess = localStorage.getItem("access_token");
  if (prevAccess !== access) bumpSsoEpoch();
}

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

export function clearReactAuthCookies(setCookie) {
  if (!setCookie || typeof window === "undefined") return;
  const sharedDomain = getSharedAuthCookieDomain();
  const opts = {
    path: "/",
    secure: window.location.protocol === "https:",
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
    ...(sharedDomain ? { domain: sharedDomain } : {}),
  };
  setCookie("access_token", "", opts);
  setCookie("refresh_token", "", opts);
}

/** Drop client session without calling SSO logout (breaks redirect / retry loops). */
export function invalidateLocalSession(setCookie) {
  markSsoLoggedOut();
  clearAuthStorage();
  clearReactAuthCookies(setCookie);
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  ["access_token", "refresh_token", "user_id", "access", "refresh"].forEach((k) =>
    localStorage.removeItem(k)
  );
  const sharedDomain = getSharedAuthCookieDomain();
  const names = ["access_token", "refresh_token", "user_id"];
  names.forEach((n) => {
    deleteAuthCookie(n, undefined);
    if (sharedDomain) deleteAuthCookie(n, sharedDomain);
  });
}

async function refreshFromSsoCookies() {
  const response = await axios.post(AUTH_REFRESH_URL, {}, { withCredentials: true });
  const access = response.data?.access;
  if (!access) return null;
  return { access, refresh: response.data?.refresh };
}

/**
 * Single SSO entry point: valid cached JWT, else HttpOnly refresh via credentials.
 */
export async function ensureSession() {
  if (typeof window === "undefined") return null;
  if (ensureSessionInflight) return ensureSessionInflight;

  ensureSessionInflight = (async () => {
    if (isSsoLoggedOutGlobally()) {
      clearAuthStorage();
      return null;
    }

    const cached = getAccessToken();
    if (cached) {
      return { access: cached, refresh: getRefreshToken() || undefined };
    }

    try {
      const refreshed = await refreshFromSsoCookies();
      if (!refreshed?.access) {
        clearAuthStorage();
        return null;
      }
      persistAuthSession(refreshed.access, refreshed.refresh);
      return refreshed;
    } catch (error) {
      console.error("SSO refresh failed:", error?.response?.status || error);
      clearAuthStorage();
      return null;
    }
  })().finally(() => {
    ensureSessionInflight = null;
  });

  return ensureSessionInflight;
}

/** @deprecated Use ensureSession() */
export const resolveSharedSession = ensureSession;

/**
 * Re-read session after login/logout on another *.pinksurfing.com tab.
 * Uses shared cookies first, then HttpOnly refresh.
 */
export async function reconcileSharedSession() {
  if (typeof window === "undefined") return null;
  if (isSsoLoggedOutGlobally()) {
    clearAuthStorage();
    return null;
  }

  const token = getAccessToken();
  if (token) {
    const refresh = getRefreshToken() || undefined;
    const prevAccess = localStorage.getItem("access_token");
    if (prevAccess !== token) {
      persistAuthSession(token, refresh);
    }
    return { access: token, refresh };
  }

  ensureSessionInflight = null;
  return ensureSession();
}

/** Poll shared SSO state when this tab becomes visible (cross-subdomain sync). */
export function attachSharedSsoSync(onSync) {
  if (typeof window === "undefined") return () => {};

  let lastEpoch = getSsoEpoch();
  let timer = null;

  const scheduleSync = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const epoch = getSsoEpoch();
      const epochChanged = epoch && epoch !== lastEpoch;
      if (epochChanged) lastEpoch = epoch;
      if (epochChanged || document.visibilityState === "visible") {
        onSync();
      }
    }, 250);
  };

  const onVisible = () => {
    if (document.visibilityState === "visible") scheduleSync();
  };

  window.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", scheduleSync);

  return () => {
    if (timer) clearTimeout(timer);
    window.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", scheduleSync);
  };
}

export async function refreshAccessToken() {
  const refreshed = await refreshFromSsoCookies();
  if (!refreshed?.access) throw new Error("No access token in refresh response");
  persistAuthSession(refreshed.access, refreshed.refresh);
  return refreshed.access;
}

export async function signOut(accessToken, setCookie) {
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
  clearReactAuthCookies(setCookie);
}

const API_BASE = import.meta.env.VITE_SERVER_URL;

export async function fetchCustomerProfile(accessToken) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    const response = await axios.get(`${API_BASE}/api/customer/profile/`, { headers });
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) throw error;
    if (status === 400 || status === 404) {
      try {
        await axios.post(
          `${API_BASE}/api/customer/create-customer-from-sso/`,
          {},
          { headers }
        );
        const retry = await axios.get(`${API_BASE}/api/customer/profile/`, { headers });
        return retry.data;
      } catch (syncError) {
        console.error("create-customer-from-sso failed:", syncError?.response?.data || syncError);
      }
    }
    throw error;
  }
}
