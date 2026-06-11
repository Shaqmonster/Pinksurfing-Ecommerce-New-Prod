import axios from "axios";
import { getCookie, getSharedAuthCookieDomain } from "./cookie";

const SSO_LOGOUT_COOKIE = "ps_sso_logged_out";
const SSO_EPOCH_COOKIE = "ps_sso_epoch";
const AUTH_REFRESH_URL = "https://auth.pinksurfing.com/api/token/refresh/";
const AUTH_LOGOUT_URL = "https://auth.pinksurfing.com/api/logout/";
const AUTH_USER_URL = "https://auth.pinksurfing.com/api/user/";
/** Clock skew buffer — token treated as expired this many seconds early. */
const ACCESS_SKEW_SECONDS = 60;
/** SSO default: JWT_ACCESS_LIFETIME_MINUTES=15 (sso/settings.py). */
export const SSO_ACCESS_LIFETIME_MINUTES = 15;
/** Refresh this many seconds before JWT exp (proactive, not after expiry). */
export const REFRESH_BEFORE_EXPIRY_SECONDS = 120;
/** Safety poll — half of default access lifetime. */
export const TOKEN_REFRESH_FALLBACK_MS = 5 * 60 * 1000;
/** Never block app bootstrap on a stuck SSO refresh. */
export const AUTH_NETWORK_TIMEOUT_MS = 15_000;

let ensureSessionInflight = null;
let refreshInflight = null;
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

/** Unix ms when access JWT expires (from `exp` claim). */
export function getAccessTokenExpiresAtMs(token) {
  const payload = decodeJwt(token);
  if (typeof payload?.exp !== "number") return null;
  return payload.exp * 1000;
}

/**
 * True when access should be refreshed proactively (SSO: 15 min lifetime).
 * Refreshes REFRESH_BEFORE_EXPIRY_SECONDS before exp, not after expiry.
 */
export function shouldRefreshAccessToken(
  token,
  bufferSeconds = REFRESH_BEFORE_EXPIRY_SECONDS
) {
  if (!token) return true;
  const expiresAtMs = getAccessTokenExpiresAtMs(token);
  if (!expiresAtMs) return true;
  const refreshAtMs = expiresAtMs - bufferSeconds * 1000;
  return Date.now() >= refreshAtMs;
}

/** Ms until proactive refresh; 0 means refresh now. */
export function getMsUntilProactiveRefresh(
  token,
  bufferSeconds = REFRESH_BEFORE_EXPIRY_SECONDS
) {
  const expiresAtMs = getAccessTokenExpiresAtMs(token);
  if (!expiresAtMs) return 0;
  const refreshAtMs = expiresAtMs - bufferSeconds * 1000;
  return Math.max(0, refreshAtMs - Date.now());
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

/** Raw access JWT from storage (may be expired — used for proactive refresh timing). */
export function getSessionAccessToken() {
  if (typeof window === "undefined") return "";
  const candidates = [
    runtimeAuthToken,
    getCookie("access_token"),
    localStorage.getItem("access_token"),
    localStorage.getItem("access"),
  ].filter(Boolean);
  for (const raw of candidates) {
    const token = String(raw).replaceAll('"', "");
    if (token) return token;
  }
  return "";
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

const AUTH_API_HOST = "auth.pinksurfing.com";

/** Login, refresh, and logout must not run through the auth request interceptor. */
export function isSsoTokenMaintenanceUrl(url) {
  if (!url || typeof url !== "string") return false;
  const path = url.split("?")[0];
  return (
    path.includes("/api/token/refresh") ||
    path.includes("/api/logout") ||
    /\/api\/token\/?$/.test(path)
  );
}

/** Cookie-based refresh first, then Bearer body `{ refresh }` fallback. */
async function requestTokenRefresh() {
  const refreshConfig = {
    withCredentials: true,
    skipAuthRefresh: true,
    timeout: AUTH_NETWORK_TIMEOUT_MS,
  };
  try {
    const cookieResponse = await axios.post(
      AUTH_REFRESH_URL,
      {},
      refreshConfig
    );
    const access = cookieResponse.data?.access;
    if (access) {
      return { access, refresh: cookieResponse.data?.refresh };
    }
  } catch {
    /* try body refresh */
  }

  const refresh = getRefreshToken();
  if (!refresh) return null;

  const bodyResponse = await axios.post(
    AUTH_REFRESH_URL,
    { refresh },
    refreshConfig
  );
  const access = bodyResponse.data?.access;
  if (!access) return null;
  return { access, refresh: bodyResponse.data?.refresh ?? refresh };
}

export function hasRefreshCapability() {
  if (isSsoLoggedOutGlobally()) return false;
  if (getRefreshToken()) return true;
  // SSO refresh_token is HttpOnly — not readable here, but sent with credentials:include
  return Boolean(getSessionAccessToken());
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

    if (!hasRefreshCapability()) {
      clearAuthStorage();
      return null;
    }

    try {
      const refreshed = await requestTokenRefresh();
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
  if (refreshInflight) return refreshInflight;

  refreshInflight = (async () => {
    const refreshed = await requestTokenRefresh();
    if (!refreshed?.access) {
      throw new Error("No access token in refresh response");
    }
    persistAuthSession(refreshed.access, refreshed.refresh);
    return refreshed.access;
  })().finally(() => {
    refreshInflight = null;
  });

  return refreshInflight;
}

/** Returns a valid access token, refreshing before JWT exp per SSO settings. */
export async function getOrRefreshAccessToken() {
  if (isSsoLoggedOutGlobally()) return null;

  const sessionToken = getSessionAccessToken();
  if (sessionToken && !shouldRefreshAccessToken(sessionToken)) {
    return isAccessTokenValid(sessionToken) ? sessionToken : null;
  }

  if (!hasRefreshCapability()) {
    return sessionToken && isAccessTokenValid(sessionToken) ? sessionToken : null;
  }

  try {
    return await refreshAccessToken();
  } catch (error) {
    console.error("Token refresh failed:", error?.response?.status || error);
    if (sessionToken && !isAccessTokenValid(sessionToken)) {
      clearAuthStorage();
    }
    return sessionToken && isAccessTokenValid(sessionToken) ? sessionToken : null;
  }
}

/**
 * Schedules refresh from JWT `exp` (2 min before expiry) + 5 min safety poll.
 * Matches SSO JWT_ACCESS_LIFETIME_MINUTES=15 (sso/settings.py).
 */
export function startTokenRefreshScheduler(onRefreshed) {
  if (typeof window === "undefined") return () => {};

  let timeoutId = null;

  const scheduleNext = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const current = getSessionAccessToken();
    const msUntil = current
      ? getMsUntilProactiveRefresh(current)
      : TOKEN_REFRESH_FALLBACK_MS;
    const delay = Math.min(Math.max(msUntil, 1_000), TOKEN_REFRESH_FALLBACK_MS);
    timeoutId = setTimeout(() => {
      void tick();
    }, delay);
  };

  const tick = async () => {
    if (isSsoLoggedOutGlobally()) return;

    const current = getSessionAccessToken();
    if (!shouldRefreshAccessToken(current)) {
      scheduleNext();
      return;
    }

    try {
      const access = await refreshAccessToken();
      onRefreshed?.(access);
    } catch {
      /* fallback poll or 401 handler will retry */
    }
    scheduleNext();
  };

  const intervalId = setInterval(() => {
    void tick();
  }, TOKEN_REFRESH_FALLBACK_MS);

  const onVisible = () => {
    if (document.visibilityState === "visible") void tick();
  };

  document.addEventListener("visibilitychange", onVisible);
  void tick();

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    clearInterval(intervalId);
    document.removeEventListener("visibilitychange", onVisible);
  };
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
        skipAuthRefresh: true,
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

export function isEcommerceApiUrl(url) {
  if (!url || !API_BASE) return false;
  return url.startsWith(API_BASE) || url.includes("ecommerceapi.pinksurfing.com");
}

/** Attach Bearer token on our API hosts (ecommerce + SSO auth). */
export function shouldAttachAuthHeader(url) {
  if (!url || typeof url !== "string") return false;
  if (isSsoTokenMaintenanceUrl(url)) return false;
  if (API_BASE && url.startsWith(API_BASE)) return true;
  if (url.includes("ecommerceapi.pinksurfing.com")) return true;
  if (url.includes(AUTH_API_HOST)) return true;
  return false;
}

export async function fetchSsoUserProfile(accessToken) {
  try {
    const response = await axios.get(AUTH_USER_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    console.warn("SSO user profile fetch failed:", error?.response?.status || error);
    return null;
  }
}

/** Merge marketplace customer with SSO account names when customer fields are empty. */
export function enrichCustomerProfile(profile, ssoUser, accessToken) {
  if (!profile) return profile;
  const payload = decodeJwt(accessToken) || {};
  const sso = ssoUser || {};
  const email = profile.email || sso.email || payload.email || "";
  const firstName =
    profile.first_name?.trim() ||
    sso.first_name?.trim() ||
    payload.first_name?.trim() ||
    (email.includes("@") ? email.split("@")[0] : "");
  const lastName =
    profile.last_name?.trim() ||
    sso.last_name?.trim() ||
    payload.last_name?.trim() ||
    "";
  return {
    ...profile,
    email,
    first_name: firstName,
    last_name: lastName,
  };
}

export async function fetchCustomerProfile(accessToken) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const loadEnrichedProfile = async (data) => {
    const ssoUser = await fetchSsoUserProfile(accessToken);
    return enrichCustomerProfile(data, ssoUser, accessToken);
  };

  try {
    const response = await axios.get(`${API_BASE}/api/customer/profile/`, { headers });
    return loadEnrichedProfile(response.data);
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
        return loadEnrichedProfile(retry.data);
      } catch (syncError) {
        console.error("create-customer-from-sso failed:", syncError?.response?.data || syncError);
      }
    }
    throw error;
  }
}
