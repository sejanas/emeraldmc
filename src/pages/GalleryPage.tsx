import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import useGallery from "@/hooks/useGallery";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageIcon } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" },
  }),
};

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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {cats.map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${filter === c ? "bg-primary text-primary-foreground scale-105" : "bg-accent text-accent-foreground hover:bg-accent/80 hover:scale-105"}`}
            >{c}</button>
          ))}
        </motion.div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              onClick={() => setLightbox({ url: item.image_url, title: item.title })}
              className="group relative overflow-hidden rounded-xl border border-border text-left focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <img src={item.image_url} alt={item.title} className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-100 md:opacity-0 md:transition-opacity md:duration-300 md:group-hover:opacity-100" />
              <span className="absolute bottom-3 left-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground opacity-100 md:opacity-0 md:transition-all md:duration-300 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0">
                {item.category}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center"
        >
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No gallery images yet.</p>
        </motion.div>
      )}

      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-3xl p-2">
          {lightbox && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <img src={lightbox.url} alt={lightbox.title} className="w-full rounded-lg object-contain max-h-[80vh]" />
              <p className="mt-2 text-center text-sm font-medium text-foreground">{lightbox.title}</p>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryPage;
