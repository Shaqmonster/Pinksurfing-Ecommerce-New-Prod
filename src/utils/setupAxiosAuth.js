import axios from "axios";
import { getResolvedAccessToken, shouldAttachAuthHeader } from "./authSession";

let installed = false;

function resolveRequestUrl(config) {
  const url = String(config.url || "");
  if (/^https?:\/\//i.test(url)) return url;
  const base = String(config.baseURL || "");
  if (!base) return url;
  return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

/** Attach Bearer token on every ecommerce / SSO API request. */
export function setupAxiosAuth() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  axios.interceptors.request.use((config) => {
    const url = resolveRequestUrl(config);
    if (!shouldAttachAuthHeader(url)) return config;

    const token = getResolvedAccessToken();
    if (!token) return config;

    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

setupAxiosAuth();
