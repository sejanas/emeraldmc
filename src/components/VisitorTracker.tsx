import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Eye } from "lucide-react";

const VisitorTracker = () => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Track visit via API (fire and forget)
    api.post("/visitors/track", {
      page: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    }).catch(() => {});

    // Fetch public count via API
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
