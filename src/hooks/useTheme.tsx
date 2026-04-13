import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemePreset {
  value: string;
  label: string;
  h: number;
  s: number;
  l: number;
}

export const THEME_PRESETS: ThemePreset[] = [
  { value: "emerald", label: "Emerald", h: 162, s: 63, l: 35 },
  { value: "blue", label: "Blue Medical", h: 221, s: 83, l: 53 },
  { value: "teal", label: "Teal", h: 174, s: 60, l: 38 },
  { value: "cyan", label: "Cyan", h: 188, s: 78, l: 42 },
  { value: "sky", label: "Sky Blue", h: 199, s: 89, l: 48 },
  { value: "indigo", label: "Indigo", h: 239, s: 84, l: 67 },
  { value: "violet", label: "Violet", h: 258, s: 65, l: 58 },
  { value: "purple", label: "Purple", h: 271, s: 76, l: 53 },
  { value: "fuchsia", label: "Fuchsia", h: 292, s: 84, l: 61 },
  { value: "rose", label: "Rose", h: 350, s: 70, l: 55 },
  { value: "crimson", label: "Crimson", h: 348, s: 83, l: 47 },
  { value: "wine", label: "Wine", h: 340, s: 55, l: 40 },
  { value: "orange", label: "Orange", h: 25, s: 95, l: 53 },
  { value: "amber", label: "Amber", h: 38, s: 92, l: 50 },
  { value: "gold", label: "Gold", h: 45, s: 80, l: 45 },
  { value: "lime", label: "Lime", h: 84, s: 78, l: 40 },
  { value: "sage", label: "Sage", h: 158, s: 40, l: 48 },
  { value: "slate", label: "Steel", h: 215, s: 25, l: 45 },
];

interface ThemeColorValue {
  preset: string;
  h?: number;
  s?: number;
  l?: number;
}

interface ThemeContextValue {
  colorPreset: string;
  customHsl: { h: number; s: number; l: number } | null;
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  setColorPreset: (preset: string) => Promise<void>;
  setCustomColor: (h: number, s: number, l: number) => Promise<void>;
  setMode: (m: ThemeMode) => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const MODE_KEY = "site-mode";
const THEME_CACHE_KEY = "site-theme-cache";

function getSystemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyThemeColors(h: number, s: number, l: number, isDark: boolean) {
  const root = document.documentElement;
  const set = (k: string, v: string) => root.style.setProperty(k, v);

  // Enable transition
  root.classList.add("theme-transition");
  requestAnimationFrame(() => {
    setTimeout(() => root.classList.remove("theme-transition"), 400);
  });

  if (isDark) {
    root.classList.add("dark");
    const dl = Math.min(l + 12, 60);
    const ds = Math.min(s, 60);

    set('--background', '220 15% 8%');
    set('--foreground', '210 10% 95%');
    set('--card', '220 15% 10%');
    set('--card-foreground', '210 10% 95%');
    set('--popover', '220 15% 10%');
    set('--popover-foreground', '210 10% 95%');
    set('--primary', `${h} ${ds}% ${dl}%`);
    set('--primary-foreground', '0 0% 100%');
    set('--secondary', '220 15% 15%');
    set('--secondary-foreground', '210 10% 90%');
    set('--muted', '220 15% 15%');
    set('--muted-foreground', '210 10% 60%');
    set('--accent', '220 15% 18%');
    set('--accent-foreground', '210 10% 90%');
    set('--destructive', '0 62% 30%');
    set('--destructive-foreground', '0 0% 100%');
    set('--border', '220 15% 18%');
    set('--input', '220 15% 18%');
    set('--ring', `${h} ${ds}% ${dl}%`);

    set('--sidebar-background', '220 15% 10%');
    set('--sidebar-foreground', '210 10% 90%');
    set('--sidebar-primary', `${h} ${ds}% ${dl}%`);
    set('--sidebar-primary-foreground', '0 0% 100%');
    set('--sidebar-accent', '220 15% 15%');
    set('--sidebar-accent-foreground', '210 10% 90%');
    set('--sidebar-border', '220 15% 18%');
    set('--sidebar-ring', `${h} ${ds}% ${dl}%`);

    set('--hero-gradient', `linear-gradient(135deg, hsl(${h} ${ds}% ${dl}%), hsl(${(h + 8) % 360} ${Math.max(ds - 5, 30)}% ${Math.max(dl - 5, 30)}%))`);
    set('--section-gradient', 'linear-gradient(180deg, hsl(220 15% 10%) 0%, hsl(220 15% 8%) 100%)');
    set('--card-shadow', '0 4px 24px -4px hsl(0 0% 0% / 0.3)');
    set('--card-shadow-hover', `0 8px 32px -4px hsl(${h} ${ds}% ${dl}% / 0.2)`);
  } else {
    root.classList.remove("dark");

    set('--background', '0 0% 100%');
    set('--foreground', '200 15% 15%');
    set('--card', '0 0% 100%');
    set('--card-foreground', '200 15% 15%');
    set('--popover', '0 0% 100%');
    set('--popover-foreground', '200 15% 15%');
    set('--primary', `${h} ${s}% ${l}%`);
    set('--primary-foreground', '0 0% 100%');
    set('--secondary', `${h} 20% 95%`);
    set('--secondary-foreground', `${h} ${s}% 25%`);
    set('--muted', `${h} 10% 96%`);
    set('--muted-foreground', '200 10% 45%');
    set('--accent', `${h} 40% 92%`);
    set('--accent-foreground', `${h} ${s}% 25%`);
    set('--destructive', '0 84% 60%');
    set('--destructive-foreground', '0 0% 100%');
    set('--border', `${h} 15% 90%`);
    set('--input', `${h} 15% 88%`);
    set('--ring', `${h} ${s}% ${l}%`);

    set('--sidebar-background', `${h} 15% 97%`);
    set('--sidebar-foreground', '200 15% 25%');
    set('--sidebar-primary', `${h} ${s}% ${l}%`);
    set('--sidebar-primary-foreground', '0 0% 100%');
    set('--sidebar-accent', `${h} 20% 93%`);
    set('--sidebar-accent-foreground', '200 15% 20%');
    set('--sidebar-border', `${h} 15% 90%`);
    set('--sidebar-ring', `${h} ${s}% ${l}%`);

    set('--hero-gradient', `linear-gradient(135deg, hsl(${h} ${s}% ${l}%), hsl(${(h + 8) % 360} ${Math.max(s - 8, 30)}% ${Math.max(l - 5, 25)}%))`);
    set('--section-gradient', `linear-gradient(180deg, hsl(${h} 40% 96%) 0%, hsl(0 0% 100%) 100%)`);
    set('--card-shadow', `0 4px 24px -4px hsl(${h} ${s}% ${l}% / 0.08)`);
    set('--card-shadow-hover', `0 8px 32px -4px hsl(${h} ${s}% ${l}% / 0.15)`);
  }

  set('--theme-swatch', `${h} ${s}% ${l}%`);
}

function getHslFromTheme(val: ThemeColorValue): { h: number; s: number; l: number } {
  if (val.preset === "custom" && val.h != null && val.s != null && val.l != null) {
    return { h: val.h, s: val.s, l: val.l };
  }
  const preset = THEME_PRESETS.find(p => p.value === val.preset);
  return preset ? { h: preset.h, s: preset.s, l: preset.l } : { h: 162, s: 63, l: 35 };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeVal, setThemeVal] = useState<ThemeColorValue>(() => {
    try {
      const cached = localStorage.getItem(THEME_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return { preset: "emerald" };
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(MODE_KEY) as ThemeMode | null;
    return stored && ["light", "dark", "system"].includes(stored) ? stored : "light";
  });

  const [systemDark, setSystemDark] = useState(getSystemDark);
  const [loading, setLoading] = useState(true);

  const resolvedMode = mode === "system" ? (systemDark ? "dark" : "light") : mode;

  // Fetch global theme from DB
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "theme_color")
          .single();
        if (data?.value) {
          const val = data.value as unknown as ThemeColorValue;
          setThemeVal(val);
          localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(val));
        }
      } catch {}
      setLoading(false);
    };
    fetchTheme();
  }, []);

  // Listen for system preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Apply theme
  useEffect(() => {
    const { h, s, l } = getHslFromTheme(themeVal);
    applyThemeColors(h, s, l, resolvedMode === "dark");
  }, [themeVal, resolvedMode]);

  const saveThemeToDB = useCallback(async (val: ThemeColorValue) => {
    setThemeVal(val);
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(val));
    await supabase
      .from("site_settings")
      .update({ value: val as any, updated_at: new Date().toISOString() })
      .eq("key", "theme_color");
  }, []);

  const setColorPreset = useCallback(async (preset: string) => {
    await saveThemeToDB({ preset });
  }, [saveThemeToDB]);

  const setCustomColor = useCallback(async (h: number, s: number, l: number) => {
    await saveThemeToDB({ preset: "custom", h, s, l });
  }, [saveThemeToDB]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem(MODE_KEY, m);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        colorPreset: themeVal.preset,
        customHsl: themeVal.preset === "custom" && themeVal.h != null ? { h: themeVal.h, s: themeVal.s!, l: themeVal.l! } : null,
        mode,
        resolvedMode,
        setColorPreset,
        setCustomColor,
        setMode,
        loading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
