import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Eye } from "lucide-react";

const TRACK_KEY = "emerald_tracked_pages";
const DURATION_KEY = "emerald_page_enter";
const PERSISTENT_ID_KEY = "emerald_visitor_id";

function getUtmParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign"] as const) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  return utm;
}

/** Stable cross-session visitor identity stored in localStorage */
function getPersistentId(): string {
  let id = localStorage.getItem(PERSISTENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PERSISTENT_ID_KEY, id);
  }
  return id;
}

const VisitorTracker = () => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const page = window.location.pathname;
    const tracked: string[] = JSON.parse(sessionStorage.getItem(TRACK_KEY) || "[]");

    // Record page enter time for duration tracking
    sessionStorage.setItem(DURATION_KEY, String(Date.now()));

    if (!tracked.includes(page)) {
      const utm = getUtmParams();
      api.post("/visitors/track", {
        page,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        persistent_id: getPersistentId(),
        screen_width: window.screen?.width ?? null,
        screen_height: window.screen?.height ?? null,
        ...utm,
      }).then(() => {
        tracked.push(page);
        sessionStorage.setItem(TRACK_KEY, JSON.stringify(tracked));
      }).catch(() => {});
    }

    // Send page duration on visibility change or unload
    const sendDuration = () => {
      const enter = parseInt(sessionStorage.getItem(DURATION_KEY) || "0");
      if (!enter) return;
      const sec = Math.round((Date.now() - enter) / 1000);
      if (sec < 1 || sec > 3600) return; // ignore <1s or >1hr noise
      // Use sendBeacon for reliable delivery on page unload
      // Fall back to api.post if sendBeacon unavailable
      const payload = { page, duration_sec: sec };
      if (navigator.sendBeacon) {
        const base = `${import.meta.env.VITE_SUPABASE_URL || ""}/functions/v1/api`;
        const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
        navigator.sendBeacon(
          `${base}/visitors/duration?apikey=${encodeURIComponent(key)}`,
          new Blob([JSON.stringify(payload)], { type: "application/json" }),
        );
      } else {
        api.post("/visitors/duration", payload).catch(() => {});
      }
      sessionStorage.removeItem(DURATION_KEY);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendDuration();
      if (document.visibilityState === "visible") sessionStorage.setItem(DURATION_KEY, String(Date.now()));
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", sendDuration);

    // Fetch public count
    api.get<{ count: number }>("/visitors/count")
      .then((data) => { if (data?.count != null) setCount(data.count); })
      .catch(() => {});

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", sendDuration);
    };
  }, []);

  if (count === null) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Eye className="h-3 w-3" /> {count.toLocaleString()} visits
    </span>
  );
};

export default VisitorTracker;
