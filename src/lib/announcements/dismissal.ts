/**
 * Per-(id, version, placement) dismissal storage.
 *
 * Stored in localStorage as a single JSON map for cheap reads. Bumping
 * `version` (handled by DB trigger on visible-content edits) automatically
 * resurrects an announcement for users who previously dismissed it.
 */
import type { Announcement, Placement } from "./schemas";

const KEY = "emc_announcement_dismissed_v1";
const SESSION_KEY = "emc_announcement_dismissed_session_v1";

interface DismissEntry {
  dismissed_at: string;
  dismissed_until?: string;
  count: number;
}

type DismissMap = Record<string, DismissEntry>;

function entryKey(announcement: Pick<Announcement, "id" | "version">, placement: Placement): string {
  return `${announcement.id}:${announcement.version}:${placement}`;
}

function strategyOf(a: Pick<Announcement, "frequency">): string {
  return a.frequency?.strategy ?? "always";
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

function getDismissUntil(a: Pick<Announcement, "frequency">): string | undefined {
  const now = Date.now();
  const strategy = strategyOf(a);
  if (strategy === "once_per_day") return toIso(now + 24 * 60 * 60 * 1000);
  if (strategy === "cooldown") {
    const hours = Math.max(1, a.frequency?.cooldown_hours ?? 24);
    return toIso(now + hours * 60 * 60 * 1000);
  }
  if (strategy === "max_impressions") return toIso(now + 6 * 60 * 60 * 1000);
  return undefined;
}

function read(): DismissMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DismissMap;
  } catch {
    return {};
  }
}

function write(map: DismissMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // Quota exceeded or storage disabled — silently noop.
  }
}

function readSession(): Record<string, true> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, true>;
  } catch {
    return {};
  }
}

function writeSession(map: Record<string, true>): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(map));
  } catch {
    // noop
  }
}

export function isDismissed(announcement: Pick<Announcement, "id" | "version" | "frequency">, placement: Placement): boolean {
  const k = entryKey(announcement, placement);
  const strategy = strategyOf(announcement);

  // "always" = show again on every full page load; dismiss is in-memory only (provider).
  if (strategy === "always") return false;

  const sessionMap = readSession();
  if (sessionMap[k]) return true;

  const map = read();
  const entry = map[k];
  if (!entry) return false;

  if (strategy === "once_ever") return true;

  // Backward compatibility for old entries without dismissal window:
  // treat as stale for non-once_ever so active campaigns can reappear.
  if (!entry.dismissed_until) {
    delete map[k];
    write(map);
    return false;
  }

  const untilMs = Date.parse(entry.dismissed_until);
  if (Number.isNaN(untilMs)) {
    delete map[k];
    write(map);
    return false;
  }

  if (Date.now() < untilMs) return true;

  delete map[k];
  write(map);
  return false;
}

export function dismiss(announcement: Pick<Announcement, "id" | "version" | "frequency">, placement: Placement): void {
  const k = entryKey(announcement, placement);
  const strategy = strategyOf(announcement);

  if (strategy === "always") {
    return;
  }

  if (strategy === "once_per_session") {
    const sessionMap = readSession();
    sessionMap[k] = true;
    writeSession(sessionMap);
    return;
  }

  const map = read();
  const dismissed_until = getDismissUntil(announcement);
  map[k] = {
    dismissed_at: new Date().toISOString(),
    dismissed_until,
    count: (map[k]?.count ?? 0) + 1,
  };
  write(map);
}

export function clearDismissals(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // noop
  }
}
