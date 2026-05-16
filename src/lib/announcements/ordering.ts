/**
 * Ordering & exclusivity. Sorts a candidate list by (severity desc, priority desc,
 * created_at desc) and applies per-placement exclusivity (one exclusive item
 * preempts all other non-exclusive items in the same placement).
 */
import type { Announcement, Placement, Severity } from "./schemas";

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 4,
  warning: 3,
  notice: 2,
  info: 1,
};

export function compareAnnouncements(a: Announcement, b: Announcement): number {
  const sevDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
  if (sevDiff !== 0) return sevDiff;
  const prDiff = (b.priority ?? 0) - (a.priority ?? 0);
  if (prDiff !== 0) return prDiff;
  // Newer first as a tie-breaker
  const aT = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bT = b.created_at ? new Date(b.created_at).getTime() : 0;
  return bT - aT;
}

/**
 * Apply exclusivity rule for a single placement: if any candidate is `exclusive`,
 * keep only the highest-ranked exclusive one and drop everything else.
 */
export function applyExclusivity(items: Announcement[]): Announcement[] {
  const sorted = [...items].sort(compareAnnouncements);
  const firstExclusive = sorted.find((x) => x.exclusive);
  if (firstExclusive) return [firstExclusive];
  return sorted;
}

/** Group items by placement (each item appears once per placement it targets). */
export function groupByPlacement(items: Announcement[], placements: readonly Placement[]): Record<Placement, Announcement[]> {
  const out = {} as Record<Placement, Announcement[]>;
  for (const p of placements) out[p] = [];
  for (const item of items) {
    for (const p of item.placements ?? []) {
      if (out[p as Placement]) out[p as Placement].push(item);
    }
  }
  return out;
}
