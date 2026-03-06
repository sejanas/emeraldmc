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
    });

    // Fetch public count via edge function
    const fetchCount = async () => {
      const { data } = await supabase.functions.invoke("visitor-count");
      if (data?.count != null) setCount(data.count);
    };
    fetchCount();
  }, []);

  if (count === null) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Eye className="h-3 w-3" /> {count.toLocaleString()} visits
    </span>
  );
};

export default VisitorTracker;
