import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Storefront theme: the shopper picks System, Light or Dark.
 * "system" follows the device setting live. The choice is saved under
 * localStorage "ps-theme". index.html applies it before first paint;
 * keep the two in sync.
 */
const STORAGE_KEY = "ps-theme";
const LEGACY_KEY = "theme"; // written for every visitor by the old code, so it carries no choice
const PREFERENCES = ["system", "light", "dark"];
const THEME_COLOR = { light: "#f7f6fa", dark: "#0e0f13" };

const ThemeContext = createContext(null);

function readPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return PREFERENCES.includes(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(readPreference);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* storage unavailable */
    }
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return undefined;
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const resolvedTheme = preference === "system" ? (systemDark ? "dark" : "light") : preference;
  const isDarkMode = resolvedTheme === "dark";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDarkMode);
    root.style.colorScheme = resolvedTheme;
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute("content", THEME_COLOR[resolvedTheme]);
    });
  }, [isDarkMode, resolvedTheme]);

  const setPreference = useCallback((next) => {
    if (!PREFERENCES.includes(next)) return;
    setPreferenceState(next);
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable: the choice lasts for this visit only */
    }
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, isDarkMode, setPreference }),
    [preference, resolvedTheme, isDarkMode, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
