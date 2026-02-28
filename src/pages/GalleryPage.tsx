import SectionHeading from "@/components/SectionHeading";
import heroImg from "@/assets/hero-lab.png";

const categories = ["Lab Interior", "Equipment", "Staff", "Health Camps", "Certificates"];

// Placeholder gallery using the hero image for now
const galleryItems = categories.map((cat) => ({
  category: cat,
  image: heroImg,
  alt: `${cat} at Emerald Medical Care`,
}));

const GalleryPage = () => (
  <div className="container py-12">
    <SectionHeading title="Gallery" subtitle="Take a look inside our state-of-the-art diagnostic facility" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {galleryItems.map((item, i) => (
        <div key={i} className="group relative overflow-hidden rounded-xl border border-border">
          <img
            src={item.image}
            alt={item.alt}
            className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="absolute bottom-3 left-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
            {item.category}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default GalleryPage;
