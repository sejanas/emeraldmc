/**
 * Frequency strategies — controls how often the same (announcement, version)
 * is shown to a single user.
 *
 * Storage layout:
 *   localStorage["emc_announcement_freq_v1"] → Record<key, { last_shown, count }>
 *   sessionStorage["emc_announcement_freq_session_v1"] → Record<key, true>
 *
 * key = `${id}:${version}:${placement}`
 */
import type { Announcement, Placement, Frequency } from "./schemas";

const PERSIST_KEY = "emc_announcement_freq_v1";
const SESSION_KEY = "emc_announcement_freq_session_v1";

interface FreqEntry {
  last_shown: string;
  count: number;
}

type FreqMap = Record<string, FreqEntry>;

function key(a: Pick<Announcement, "id" | "version">, placement: Placement): string {
  return `${a.id}:${a.version}:${placement}`;
}

function readPersist(): FreqMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(PERSIST_KEY) || "{}");
  } catch {
    return {};
  }
}

function writePersist(map: FreqMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PERSIST_KEY, JSON.stringify(map));
  } catch {
    // noop
  }
}

function readSession(): Record<string, true> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || "{}");
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

/**
 * Check whether the announcement is allowed to show *right now* given its
 * frequency rule and recorded history. Returns true if it should show.
 */
export function shouldShow(a: Announcement, placement: Placement): boolean {
  const f: Frequency = a.frequency || { strategy: "always" };
  const k = key(a, placement);

  switch (f.strategy) {
    case "always":
      return true;

    case "once_ever": {
      return !readPersist()[k];
    }

    case "once_per_session": {
      return !readSession()[k];
    }

    case "once_per_day": {
      const entry = readPersist()[k];
      if (!entry) return true;
      const last = new Date(entry.last_shown).getTime();
      return Date.now() - last >= 24 * 60 * 60 * 1000;
    }

    case "cooldown": {
      const hours = f.cooldown_hours ?? 24;
      const entry = readPersist()[k];
      if (!entry) return true;
      const last = new Date(entry.last_shown).getTime();
      return Date.now() - last >= hours * 60 * 60 * 1000;
    }

    case "max_impressions": {
      const max = f.max_impressions ?? 1;
      const entry = readPersist()[k];
      return (entry?.count ?? 0) < max;
    }

    default:
      return true;
  }
}

/** Record an impression so future shouldShow() calls reflect it. */
export function recordImpression(a: Announcement, placement: Placement): void {
  const k = key(a, placement);
  const f: Frequency = a.frequency || { strategy: "always" };

  // Always update session marker (cheap; used by once_per_session)
  const session = readSession();
  session[k] = true;
  writeSession(session);

  // Persist for strategies that need it
  if (
    f.strategy === "once_ever" ||
    f.strategy === "once_per_day" ||
    f.strategy === "cooldown" ||
    f.strategy === "max_impressions"
  ) {
    const map = readPersist();
    const entry = map[k] || { last_shown: new Date().toISOString(), count: 0 };
    map[k] = {
      last_shown: new Date().toISOString(),
      count: entry.count + 1,
    };
    writePersist(map);
  }
}

export function clearFrequencyHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PERSIST_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // noop
  }
}
