import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  type Announcement,
  type Placement,
  type Device,
  type Audience,
  PLACEMENTS,
  matchesPage,
  matchesPlacementPages,
  matchesDevice,
  matchesAudience,
  detectDevice,
  isScheduledNow,
  applyExclusivity,
  groupByPlacement,
  shouldShow,
  isDismissed,
} from "@/lib/announcements";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useAuth } from "@/hooks/useAuth";

interface AnnouncementCtx {
  /** All currently visible announcements grouped by placement (after every filter). */
  byPlacement: Record<Placement, Announcement[]>;
  /** Manually mark an item as dismissed for the rest of this render. */
  dismissLocal: (id: string, version: number, placement: Placement) => void;
  /** True when the data has loaded (first time). */
  loaded: boolean;
  device: Device;
}

const Ctx = createContext<AnnouncementCtx | null>(null);

const EMPTY_BY_PLACEMENT: Record<Placement, Announcement[]> = {
  top_bar: [],
  popup: [],
  home_section: [],
  corner_toast: [],
  inline: [],
};

const VISITED_KEY = "emc_visited_before";

/** Global kill switch (set in console for emergency) */
function isKilled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem("emc_announcements_killed") === "1";
  } catch {
    return false;
  }
}

export function AnnouncementProvider({ children }: { children: ReactNode }) {
  const { data, isSuccess } = useAnnouncements();
  const { user } = useAuth();
  const location = useLocation();
  const [device, setDevice] = useState<Device>(() => detectDevice());
  const [tick, setTick] = useState(0); // re-trigger filter when local dismiss happens
  const localDismissed = useRef<Set<string>>(new Set());

  // Keep schedule filters fresh for long-lived tabs.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = window.setInterval(() => {
      setTick((x) => x + 1);
    }, 60_000);
    return () => window.clearInterval(t);
  }, []);

  // Re-detect device on resize (debounced via timeout)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let t: number;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => setDevice(detectDevice()), 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const audience: Audience[] = useMemo(() => {
    const out: Audience[] = ["all"];
    out.push(user ? "authenticated" : "guest");
    // Returning vs new — explicit first-visit marker.
    try {
      if (typeof window !== "undefined" && window.localStorage.getItem(VISITED_KEY) === "1") {
        out.push("returning");
      } else {
        out.push("new");
        if (typeof window !== "undefined") {
          window.localStorage.setItem(VISITED_KEY, "1");
        }
      }
    } catch {
      out.push("new");
    }
    return out;
  }, [user]);

  const byPlacement = useMemo<Record<Placement, Announcement[]>>(() => {
    if (isKilled() || !data || data.length === 0) return EMPTY_BY_PLACEMENT;

    const filtered = data.filter((a) => {
      if (!isScheduledNow(a)) return false;
      if (!matchesPage(a, location.pathname)) return false;
      if (!matchesDevice(a, device)) return false;
      if (!matchesAudience(a, audience)) return false;
      return true;
    });

    // Per-placement filtering: dismissal + frequency + exclusivity
    const grouped = groupByPlacement(filtered, PLACEMENTS);
    const out = {} as Record<Placement, Announcement[]>;
    for (const placement of PLACEMENTS) {
      const items = grouped[placement].filter((a) => {
        if (!matchesPlacementPages(a, placement, location.pathname)) return false;
        if (isDismissed(a, placement)) return false;
        if (localDismissed.current.has(`${a.id}:${a.version}:${placement}`)) return false;
        if (!shouldShow(a, placement)) return false;
        return true;
      });
      out[placement] = applyExclusivity(items);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, location.pathname, device, audience, tick]);

  const value = useMemo<AnnouncementCtx>(
    () => ({
      byPlacement,
      device,
      loaded: isSuccess,
      dismissLocal: (id, version, placement) => {
        localDismissed.current.add(`${id}:${version}:${placement}`);
        setTick((t) => t + 1);
      },
    }),
    [byPlacement, device, isSuccess],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAnnouncementCtx(): AnnouncementCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Provider not mounted — return safe empty state so renderers fail closed.
    return {
      byPlacement: EMPTY_BY_PLACEMENT,
      device: "desktop",
      loaded: false,
      dismissLocal: () => {},
    };
  }
  return ctx;
}

export function usePlacementAnnouncements(placement: Placement): Announcement[] {
  return useAnnouncementCtx().byPlacement[placement] ?? [];
}
