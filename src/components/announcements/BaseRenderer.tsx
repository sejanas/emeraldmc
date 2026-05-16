import { useMemo, type CSSProperties } from "react";
import * as LucideIcons from "lucide-react";
import { Megaphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Announcement, Theme } from "@/lib/announcements";
import { getTypePreset, sanitizeHtml } from "@/lib/announcements";
import { useTheme } from "@/hooks/useTheme";

interface IconRendererProps {
  name?: string | null;
  fallback?: LucideIcon;
  className?: string;
}

export function AnnouncementIcon({ name, fallback, className }: IconRendererProps) {
  const Fallback = fallback ?? Megaphone;
  const Comp = (name && (LucideIcons as unknown as Record<string, LucideIcon>)[name]) || Fallback;
  return <Comp className={className} />;
}

/**
 * Resolve effective theme accounting for dark mode overrides + type preset fallback.
 */
export function useResolvedTheme(a: Announcement): { theme: Theme; accent: string; style: CSSProperties } {
  const { resolvedMode } = useTheme();
  const isDark = resolvedMode === "dark";
  const preset = getTypePreset(a.type);

  return useMemo(() => {
    const base = a.theme ?? {};
    const overrides = isDark ? base.dark_mode_overrides ?? {} : {};
    const merged: Theme = {
      ...base,
      accent_color: overrides.accent_color ?? base.accent_color ?? null,
      background_color: overrides.background_color ?? base.background_color ?? null,
      text_color: overrides.text_color ?? base.text_color ?? null,
    };
    const accent = (merged.accent_color as string) || preset.accent;
    const style: CSSProperties = {};
    if (merged.background_color) style.backgroundColor = merged.background_color as string;
    if (merged.text_color) style.color = merged.text_color as string;
    return { theme: merged, accent, style };
  }, [a.theme, a.type, isDark, preset.accent]);
}

interface BodyHtmlProps {
  html: string;
  className?: string;
}

/** Render sanitized HTML (defense-in-depth: server already sanitizes). */
export function AnnouncementBody({ html, className }: BodyHtmlProps) {
  const safe = useMemo(() => sanitizeHtml(html), [html]);
  if (!safe.trim()) return null;
  return (
    <div
      className={className}
      // Sanitized via DOMPurify above
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
