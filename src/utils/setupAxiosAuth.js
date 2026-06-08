import axios from "axios";
import { getOrRefreshAccessToken, shouldAttachAuthHeader } from "./authSession";

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

  axios.interceptors.request.use(async (config) => {
    const url = resolveRequestUrl(config);
    if (!shouldAttachAuthHeader(url)) return config;

    const token = await getOrRefreshAccessToken();
    if (!token) return config;

    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

setupAxiosAuth();
