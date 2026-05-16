/**
 * Targeting filters: pages, devices, audiences.
 *
 * These are UX filters, NOT security boundaries. The server still returns
 * all visible rows; the client decides which to render.
 */
import type { Announcement, Device, Audience, Placement } from "./schemas";

/**
 * Glob-ish matcher.
 * "/" → exact root only
 * "/path" → exact match
 * "/path/*" → first-level children of /path (no nested slashes)
 * "/path/**" → /path and all descendants
 */
export function pathMatches(pattern: string, path: string): boolean {
  if (!pattern) return false;
  // Normalize: strip trailing slashes (except root)
  const norm = (s: string) => (s.length > 1 && s.endsWith("/") ? s.slice(0, -1) : s);
  const p = norm(path);
  const pat = norm(pattern);

  if (pat === p) return true;

  if (pat.endsWith("/**")) {
    const prefix = pat.slice(0, -3);
    return prefix === "" || p === prefix || p.startsWith(prefix + "/");
  }
  if (pat.endsWith("/*")) {
    const prefix = pat.slice(0, -2);
    if (!p.startsWith(prefix + "/")) return false;
    const rest = p.slice(prefix.length + 1);
    return rest.length > 0 && !rest.includes("/");
  }
  if (pat.endsWith("*")) {
    return p.startsWith(pat.slice(0, -1));
  }
  return false;
}

export function matchesPage(a: Announcement, currentPath: string): boolean {
  const rules = a.page_rules || {};
  const include = rules.include ?? [];
  const exclude = rules.exclude ?? [];

  if (exclude.some((p) => pathMatches(p, currentPath))) return false;
  if (include.length === 0) return true;
  return include.some((p) => pathMatches(p, currentPath));
}

/** Per-placement page allowlist from presentation[placement].pages */
export function matchesPlacementPages(
  a: Announcement,
  placement: Placement,
  currentPath: string,
): boolean {
  const pages = a.presentation?.[placement]?.pages;
  if (!pages || pages.length === 0) return true;
  return pages.some((p) => pathMatches(p, currentPath));
}

export function matchesDevice(a: Announcement, device: Device): boolean {
  const list = a.devices ?? [];
  if (list.length === 0) return true;
  return list.includes(device);
}

export function matchesAudience(a: Announcement, audience: Audience[]): boolean {
  const list = a.audience ?? ["all"];
  if (list.includes("all")) return true;
  return audience.some((aud) => list.includes(aud));
}

/** Detect device class from viewport width (called once in provider). */
export function detectDevice(): Device {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}
