import { useEffect, useRef } from "react";

/**
 * Poll while `enabled`. Skips ticks when the tab is hidden; runs once when the tab is focused again.
 */
export function useBackgroundPoll(callback, { enabled = true, intervalMs = 5000 } = {}) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!enabled) return undefined;

    const run = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      cbRef.current();
    };

    const id = setInterval(run, intervalMs);
    const onVisible = () => {
      if (!document.hidden) cbRef.current();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [enabled, intervalMs]);
}
