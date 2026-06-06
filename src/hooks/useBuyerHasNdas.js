import { useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { useAccessToken } from "./useAccessToken";

const BASE = import.meta.env.VITE_SERVER_URL || "";

/**
 * True when the logged-in buyer has at least one NDA row returned by GET /api/nda/mine/
 * (same visibility rules as My NDAs page — excludes pending_payment).
 */
export function useBuyerHasNdas() {
  const accessToken = useAccessToken();
  const [cookies] = useCookies(["access_token"]);
  const [hasNdas, setHasNdas] = useState(false);

  useEffect(() => {
    const raw = accessToken;
    const token = typeof raw === "string" ? raw.replace(/"/g, "") : "";
    if (!token || !BASE) {
      setHasNdas(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${BASE}/api/nda/mine/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = res.data;
        if (!cancelled) {
          setHasNdas(Array.isArray(list) && list.length > 0);
        }
      } catch {
        if (!cancelled) setHasNdas(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return hasNdas;
}
