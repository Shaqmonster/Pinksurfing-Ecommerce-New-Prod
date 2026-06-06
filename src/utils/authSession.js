import axios from "axios";
import { getCookie, getSharedAuthCookieDomain } from "./cookie";

const SSO_LOGOUT_COOKIE = "ps_sso_logged_out";
const SSO_EPOCH_COOKIE = "ps_sso_epoch";
const AUTH_REFRESH_URL = "https://auth.pinksurfing.com/api/token/refresh/";
const AUTH_LOGOUT_URL = "https://auth.pinksurfing.com/api/logout/";
const ACCESS_SKEW_SECONDS = 60;

let ensureSessionInflight = null;
/** In-memory token from React auth context (synced on login/logout/refresh). */
let runtimeAuthToken = "";

export function setRuntimeAuthToken(token) {
  runtimeAuthToken = token ? String(token).replaceAll('"', "") : "";
}

/** Single resolver for API calls: runtime context → cookie → localStorage. */
export function getResolvedAccessToken() {
  return (
    resolveAccessToken(runtimeAuthToken, getCookie("access_token")) ||
    getAccessToken() ||
    ""
  );
}

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
  if (isSsoLoggedOutGlobally()) return;
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

/** Prefer auth context, then react-cookie, then localStorage SSO session. */
export function resolveAccessToken(authToken, cookieToken) {
  const token =
    authToken || cookieToken || getCachedAccessToken() || getCookie("access_token") || "";
  return token ? String(token).replaceAll('"', "") : "";
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

  const prevAccess = localStorage.getItem("access_token");

  clearSsoLoggedOutFlag();
  localStorage.setItem("access_token", access);
  localStorage.removeItem("access");
  setRuntimeAuthToken(access);

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

/** Clear tokens/cookies only — does not set the global logout flag. */
export function clearClientAuthStorage(setCookie) {
  clearAuthStorage();
  clearReactAuthCookies(setCookie);
}

/** Drop client session without calling SSO logout (breaks redirect / retry loops). */
export function invalidateLocalSession(setCookie) {
  if (!isSsoLoggedOutGlobally()) {
    markSsoLoggedOut();
  }
  clearClientAuthStorage(setCookie);
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  setRuntimeAuthToken("");
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

/** Notify other tabs when login/logout happens on another *.pinksurfing.com app. */
export function attachSharedSsoSync(onSync) {
  if (typeof window === "undefined") return () => {};

  let lastEpoch = getSsoEpoch();
  let timer = null;

  const checkEpoch = () => {
    const epoch = getSsoEpoch();
    if (!epoch || epoch === lastEpoch) return;
    lastEpoch = epoch;
    onSync();
  };

  const scheduleEpochCheck = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(checkEpoch, 300);
  };

  const onVisible = () => {
    if (document.visibilityState === "visible") scheduleEpochCheck();
  };

  window.addEventListener("visibilitychange", onVisible);

  return () => {
    if (timer) clearTimeout(timer);
    window.removeEventListener("visibilitychange", onVisible);
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
const AUTH_API_HOST = "auth.pinksurfing.com";

export function isEcommerceApiUrl(url) {
  if (!url || !API_BASE) return false;
  return url.startsWith(API_BASE) || url.includes("ecommerceapi.pinksurfing.com");
}

/** Attach Bearer token on our API hosts (ecommerce + SSO auth). */
export function shouldAttachAuthHeader(url) {
  if (!url || typeof url !== "string") return false;
  if (API_BASE && url.startsWith(API_BASE)) return true;
  if (url.includes("ecommerceapi.pinksurfing.com")) return true;
  if (url.includes(AUTH_API_HOST)) return true;
  return false;
}

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
    if (status === 401) throw error;
    if (status === 400 || status === 404 || status === 403) {
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
