import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageMeta from "@/components/PageMeta";
import useGallery from "@/hooks/useGallery";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageIcon, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const },
  }),
};

const GalleryPage = () => {
  const [filter, setFilter] = useState("All");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const galleryQuery = useGallery();

  const items: any[] = galleryQuery.data ?? [];
  const cats: string[] = ["All", ...Array.from(new Set(items.map((i: any) => i.category as string)))];
  const filtered = filter === "All" ? items : items.filter((i: any) => i.category === filter);

  const currentItem = lightboxIdx !== null ? filtered[lightboxIdx] : null;

  const goNext = useCallback(() => {
    if (lightboxIdx === null) return;
    setLightboxIdx((lightboxIdx + 1) % filtered.length);
  }, [lightboxIdx, filtered.length]);

  const goPrev = useCallback(() => {
    if (lightboxIdx === null) return;
    setLightboxIdx((lightboxIdx - 1 + filtered.length) % filtered.length);
  }, [lightboxIdx, filtered.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") setLightboxIdx(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, goNext, goPrev]);

  return (
    <>
      <PageMeta
        title="Gallery | Shifa's Mainland Healthcare"
        description="Take a look inside our state-of-the-art diagnostic facility in Sri Vijaya Puram."
      />
      <div className="container py-12">
        <Breadcrumbs items={[{ label: "Gallery" }]} />
        <SectionHeading title="Our Gallery" subtitle="Take a look inside our state-of-the-art diagnostic facility" />

        {/* Category filters */}
        {cats.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 flex flex-wrap gap-2 justify-center"
          >
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 border ${
                  filter === c
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground hover:scale-105"
                }`}
              >
                {c}
                {c !== "All" && (
                  <span className="ml-1.5 text-xs opacity-70">
                    ({items.filter((i: any) => i.category === c).length})
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}

        {/* Masonry-style grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((item: any, i: number) => (
              <motion.button
                key={item.id}
                layout
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.9 }}
                variants={fadeUp}
                custom={i}
                onClick={() => setLightboxIdx(i)}
                className="group relative w-full break-inside-avoid overflow-hidden rounded-xl border border-border bg-card text-left focus:outline-none focus:ring-2 focus:ring-primary transition-shadow hover:shadow-lg"
              >
                <div className="overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="absolute top-3 right-3 rounded-full bg-background/80 p-2 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                    <ZoomIn className="h-4 w-4 text-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-white/80 mt-1 line-clamp-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">{item.description}</p>
                  )}
                  <span className="mt-2 inline-block rounded-full bg-primary/80 px-2.5 py-0.5 text-xs font-medium text-primary-foreground w-fit translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                    {item.category}
                  </span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && !galleryQuery.isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-medium text-foreground">No images found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter !== "All" ? `No images in "${filter}" category yet.` : "Gallery images will appear here soon."}
            </p>
          </motion.div>
        )}

        {galleryQuery.isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 py-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-video rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {/* Premium Lightbox */}
        <Dialog open={lightboxIdx !== null} onOpenChange={() => setLightboxIdx(null)}>
          <DialogContent className="max-w-5xl p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
            {currentItem && (
              <motion.div
                key={currentItem.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                {/* Close button */}
                <button
                  onClick={() => setLightboxIdx(null)}
                  className="absolute -top-12 right-0 z-50 rounded-full bg-background/80 p-2 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Image */}
                <div className="rounded-xl overflow-hidden bg-background/80 backdrop-blur-sm">
                  <img
                    src={currentItem.image_url}
                    alt={currentItem.title}
                    className="w-full object-contain max-h-[80vh] rounded-t-xl"
                  />
                  {/* Info bar */}
                  <div className="px-5 py-4 bg-background/95 backdrop-blur-sm rounded-b-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{currentItem.title}</h3>
                        {currentItem.description && (
                          <p className="text-sm text-muted-foreground mt-1">{currentItem.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {currentItem.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {lightboxIdx! + 1} of {filtered.length}
                    </p>
                  </div>
                </div>

                {/* Navigation arrows */}
                {filtered.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); goPrev(); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2.5 backdrop-blur-sm text-foreground hover:bg-background transition-all hover:scale-110"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); goNext(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2.5 backdrop-blur-sm text-foreground hover:bg-background transition-all hover:scale-110"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default GalleryPage;
