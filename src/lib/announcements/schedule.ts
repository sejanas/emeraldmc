/**
 * Schedule checks: start_at/end_at + recurring time_window.
 *
 * time_window evaluation is timezone-aware via date-fns-tz so that an
 * "every weekday 9am–5pm Asia/Kolkata" rule works correctly for users in
 * any timezone.
 */
import { formatInTimeZone } from "date-fns-tz";
import type { Announcement } from "./schemas";

export function inAbsoluteWindow(a: Announcement, now: Date = new Date()): boolean {
  if (a.start_at && new Date(a.start_at).getTime() > now.getTime()) return false;
  if (a.end_at && new Date(a.end_at).getTime() < now.getTime()) return false;
  return true;
}

export function inTimeWindow(a: Announcement, now: Date = new Date()): boolean {
  const tw = a.time_window;
  if (!tw) return true;

  const tz = tw.timezone || "Asia/Kolkata";

  let dayStr: string;
  let timeStr: string;
  try {
    dayStr = formatInTimeZone(now, tz, "i"); // 1 (Mon) … 7 (Sun)
    timeStr = formatInTimeZone(now, tz, "HH:mm");
  } catch {
    // Bad timezone string → fail closed to avoid showing outside intended window.
    return false;
  }

  // date-fns "i" → Mon=1..Sun=7. Plan stores 0=Sun..6=Sat. Convert.
  const isoDay = parseInt(dayStr, 10);
  const dayOfWeek = isoDay === 7 ? 0 : isoDay;

  const days = tw.days_of_week;
  if (days && days.length > 0 && !days.includes(dayOfWeek)) return false;

  return timeStr >= tw.start_time && timeStr <= tw.end_time;
}

export function isScheduledNow(a: Announcement, now: Date = new Date()): boolean {
  return inAbsoluteWindow(a, now) && inTimeWindow(a, now);
}

// ── Lifecycle status (derived from is_active + dates + published_at + deleted_at) ──

export const LIFECYCLE_STATUSES = [
  "draft",
  "scheduled",
  "live",
  "paused",
  "expired",
  "archived",
] as const;

export type AnnouncementLifecycleStatus = typeof LIFECYCLE_STATUSES[number];

/**
 * Server and client share this rule so the status chip on the admin table
 * always matches the row the API returns for `?status=...` filters.
 *
 * Order of checks matters: archived wins over expired, expired wins over
 * paused/draft (because a row whose end_at passed is no longer revivable
 * via Resume — the admin must Republish/clone instead).
 */
export function getLifecycleStatus(a: Announcement, now: Date = new Date()): AnnouncementLifecycleStatus {
  if (a.deleted_at) return "archived";

  const nowMs = now.getTime();
  const endMs = a.end_at ? new Date(a.end_at).getTime() : null;
  if (endMs !== null && endMs < nowMs) return "expired";

  if (!a.published_at) return "draft";

  if (!a.is_active) return "paused";

  const startMs = a.start_at ? new Date(a.start_at).getTime() : null;
  if (startMs !== null && startMs > nowMs) return "scheduled";

  return "live";
}

export const LIFECYCLE_STATUS_LABELS: Record<AnnouncementLifecycleStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  live: "Live",
  paused: "Paused",
  expired: "Expired",
  archived: "Archived",
};
