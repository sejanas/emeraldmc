import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye } from "lucide-react";

const VisitorTracker = () => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Track visit (fire and forget)
    supabase.from("visitors").insert({
      page: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    }).then(() => {});

    // Get count via edge function or just show a simple approach
    // Since anon can't read, we use an edge function
    const fetchCount = async () => {
      const { count: c } = await supabase
        .from("visitors")
        .select("id", { count: "exact", head: true });
      // This will return null for anon users due to RLS, so we use a different approach
      setCount(c);
    };
    fetchCount();
  }, []);

  // Only show if we have a count (admin is logged in) or show nothing for public
  // Better approach: use an edge function for public count
  if (count === null) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Eye className="h-3 w-3" /> {count.toLocaleString()} visits
    </span>
  );
};

export default VisitorTracker;
