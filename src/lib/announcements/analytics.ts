/**
 * Lightweight analytics. Disabled by default — enable via VITE_FEATURE_ANNOUNCEMENT_ANALYTICS=1.
 *
 * Uses fetch with keepalive + Supabase anon headers so events survive unload and
 * pass the edge function gateway (same auth pattern as the rest of the app).
 */
import { api } from "@/lib/api";
import type { Announcement, Placement } from "./schemas";

const ENABLED =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_FEATURE_ANNOUNCEMENT_ANALYTICS === "1") ||
  false;

const PUBLISHABLE = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY) || "";
const BASE = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) || "";

type EventType =
  | "impression"
  | "engagement"
  | "click"
  | "cta_primary"
  | "cta_secondary"
  | "dismiss"
  | "auto_hide";

let sessionId: string | null = null;
function getSessionId(): string {
  if (sessionId) return sessionId;
  if (typeof window === "undefined") return "ssr";
  try {
    const stored = window.sessionStorage.getItem("emc_session_id");
    if (stored) {
      sessionId = stored;
      return stored;
    }
    const fresh = crypto.randomUUID();
    window.sessionStorage.setItem("emc_session_id", fresh);
    sessionId = fresh;
    return fresh;
  } catch {
    return "anon";
  }
}

function sendAnnouncementEvent(payload: Record<string, unknown>): void {
  if (!PUBLISHABLE || !BASE) {
    void api.post("/announcement-events", payload).catch(() => {});
    return;
  }
  const url = `${BASE.replace(/\/$/, "")}/functions/v1/api/announcement-events`;
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: PUBLISHABLE,
    Authorization: `Bearer ${PUBLISHABLE}`,
  };
  const unloading = typeof document !== "undefined" && document.visibilityState === "hidden";
  void fetch(url, {
    method: "POST",
    headers,
    body,
    keepalive: unloading,
  }).catch(() => {
    void api.post("/announcement-events", payload).catch(() => {});
  });
}

export function track(
  event: EventType,
  a: Announcement,
  placement: Placement,
  extra?: { device?: string; user_id?: string },
): void {
  if (!ENABLED) return;
  const payload = {
    announcement_id: a.id,
    announcement_version: a.version,
    variant_group: a.variant_group ?? null,
    event_type: event,
    placement,
    session_id: getSessionId(),
    user_id: extra?.user_id ?? null,
    page_path: typeof window !== "undefined" ? window.location.pathname : null,
    device: extra?.device ?? null,
  };
  try {
    sendAnnouncementEvent(payload);
  } catch {
    // Analytics must never break the app
  }
}
