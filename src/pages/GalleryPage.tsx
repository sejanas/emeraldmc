import { useEffect, useState } from "react";
import SectionHeading from "@/components/SectionHeading";
import { supabase } from "@/integrations/supabase/client";

interface GalleryItem {
  id: string; title: string; image_url: string; category: string;
}

const GalleryPage = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    supabase.from("gallery").select("*").order("display_order").then(({ data }) => {
      if (data) setItems(data);
    });
  }, []);

  const cats = ["All", ...Array.from(new Set(items.map((i) => i.category)))];
  const filtered = filter === "All" ? items : items.filter((i) => i.category === filter);

  return (
    <div className="container py-12">
      <SectionHeading title="Gallery" subtitle="Take a look inside our state-of-the-art diagnostic facility" />
      {cats.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === c ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
            >{c}</button>
          ))}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <div key={item.id} className="group relative overflow-hidden rounded-xl border border-border">
            <img src={item.image_url} alt={item.title} className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="absolute bottom-3 left-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
              {item.category}
            </span>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="py-12 text-center text-muted-foreground">No gallery images yet.</p>}
    </div>
  );
};

export default GalleryPage;
