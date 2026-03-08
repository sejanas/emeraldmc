import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Eye } from "lucide-react";

const TRACK_KEY = "emerald_tracked_pages";

const VisitorTracker = () => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Deduplicate: only track once per session per page path
    const page = window.location.pathname;
    const tracked: string[] = JSON.parse(sessionStorage.getItem(TRACK_KEY) || "[]");

    if (!tracked.includes(page)) {
      api.post("/visitors/track", {
        page,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      }).then(() => {
        tracked.push(page);
        sessionStorage.setItem(TRACK_KEY, JSON.stringify(tracked));
      }).catch(() => {});
    }

    // Fetch public count
    api.get<{ count: number }>("/visitors/count")
      .then((data) => { if (data?.count != null) setCount(data.count); })
      .catch(() => {});
  }, []);

  if (count === null) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Eye className="h-3 w-3" /> {count.toLocaleString()} visits
    </span>
  );
};

export default VisitorTracker;
