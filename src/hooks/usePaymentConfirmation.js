import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Poll the backend until a payment is confirmed — never assume it from a redirect.
 *
 * `check()` resolves to "confirmed" | "pending" | "failed" (anything else counts as pending).
 * Network errors are treated as pending and polling continues.
 *
 * Returns { phase, data, retry } where phase is:
 *   "verifying" — still checking
 *   "confirmed" — the backend says it is paid
 *   "failed"    — the backend says it failed or was canceled
 *   "timeout"   — still not confirmed after maxPolls (may yet arrive; offer a re-check)
 *   "missing"   — nothing to check (enabled is false)
 */
export function usePaymentConfirmation(check, { enabled = true, intervalMs = 2500, maxPolls = 24 } = {}) {
  const [phase, setPhase] = useState(enabled ? "verifying" : "missing");
  const [data, setData] = useState(null);
  const [runId, setRunId] = useState(0);
  const checkRef = useRef(check);
  checkRef.current = check;

  useEffect(() => {
    if (!enabled) {
      setPhase("missing");
      return undefined;
    }
    let cancelled = false;
    let polls = 0;
    let timer = null;
    setPhase("verifying");

    const tick = async () => {
      polls += 1;
      try {
        const result = await checkRef.current();
        if (cancelled) return;
        const status = typeof result === "string" ? result : result?.status;
        if (result && typeof result === "object") setData(result.data ?? null);
        if (status === "confirmed" || status === "failed") {
          setPhase(status);
          return;
        }
      } catch {
        /* transient — keep polling */
      }
      if (cancelled) return;
      if (polls >= maxPolls) {
        setPhase("timeout");
        return;
      }
      timer = setTimeout(tick, intervalMs);
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, intervalMs, maxPolls, runId]);

  const retry = useCallback(() => setRunId((n) => n + 1), []);
  return { phase, data, retry };
}
