import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type ThemeColor = "emerald" | "blue" | "soft";
export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  color: ThemeColor;
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  setColor: (c: ThemeColor) => void;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = "site-theme";
const MODE_KEY = "site-mode";

function getSystemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(color: ThemeColor, isDark: boolean) {
  const root = document.documentElement;

  // Enable transition class briefly
  root.classList.add("theme-transition");
  requestAnimationFrame(() => {
    setTimeout(() => root.classList.remove("theme-transition"), 400);
  });

  root.setAttribute("data-theme", color);

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [color, setColorState] = useState<ThemeColor>(() => {
    const stored = localStorage.getItem(THEME_KEY) as ThemeColor | null;
    return stored && ["emerald", "blue", "soft"].includes(stored) ? stored : "emerald";
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(MODE_KEY) as ThemeMode | null;
    return stored && ["light", "dark", "system"].includes(stored) ? stored : "system";
  });

  const [systemDark, setSystemDark] = useState(getSystemDark);

  const resolvedMode = mode === "system" ? (systemDark ? "dark" : "light") : mode;

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Apply theme whenever color or resolved mode changes
  useEffect(() => {
    applyTheme(color, resolvedMode === "dark");
  }, [color, resolvedMode]);

  const setColor = useCallback((c: ThemeColor) => {
    setColorState(c);
    localStorage.setItem(THEME_KEY, c);
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem(MODE_KEY, m);
  }, []);

  return (
    <ThemeContext.Provider value={{ color, mode, resolvedMode, setColor, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
