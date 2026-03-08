import { useState } from "react";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import useGallery from "@/hooks/useGallery";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageIcon } from "lucide-react";

const GalleryPage = () => {
  const [filter, setFilter] = useState("All");
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const galleryQuery = useGallery();

  const items: any[] = galleryQuery.data ?? [];
  const cats: string[] = ["All", ...Array.from(new Set(items.map((i: any) => i.category as string)))];
  const filtered = filter === "All" ? items : items.filter((i: any) => i.category === filter);

  return (
    <div className="container py-12">
      <Breadcrumbs items={[{ label: "Gallery" }]} />
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
        {filtered.map((item: any) => (
          <button
            key={item.id}
            onClick={() => setLightbox({ url: item.image_url, title: item.title })}
            className="group relative overflow-hidden rounded-xl border border-border text-left focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <img src={item.image_url} alt={item.title} className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100" />
            <span className="absolute bottom-3 left-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
              {item.category}
            </span>
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No gallery images yet.</p>
        </div>
      )}

      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-3xl p-2">
          {lightbox && (
            <>
              <img src={lightbox.url} alt={lightbox.title} className="w-full rounded-lg object-contain max-h-[80vh]" />
              <p className="mt-2 text-center text-sm font-medium text-foreground">{lightbox.title}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryPage;
