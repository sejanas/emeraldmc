import { Link } from "react-router-dom";
import { Phone, Mail, Clock, MapPin, Facebook, Instagram } from "lucide-react";
import { businessInfo } from "@/data/siteData";
import VisitorTracker from "@/components/VisitorTracker";
import useCategories from "@/hooks/useCategories";

const Footer = () => {
  const categoriesQuery = useCategories();
  const categories = (categoriesQuery.data ?? []).slice(0, 6);

  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-xs font-bold text-primary-foreground">E</span>
              </div>
              <span className="font-display text-base font-semibold">Emerald Medical</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Trusted ISO Certified Diagnostic Lab in Sri Vijaya Puram, providing quality healthcare services.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="https://www.facebook.com/profile.php?id=61588640095513" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-primary hover:border-primary" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://www.instagram.com/shifa_health_care0/" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-primary hover:border-primary" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Quick Links</h4>
            <nav className="flex flex-col gap-2.5">
              {[
                { to: "/tests", label: "Our Tests" },
                { to: "/packages", label: "Health Packages" },
                { to: "/doctors", label: "Our Doctors" },
                { to: "/book", label: "Book Appointment" },
                { to: "/gallery", label: "Gallery" },
                { to: "/faq", label: "FAQs" },
                { to: "/contact", label: "Contact Us" },
              ].map((l) => (
                <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Test Categories</h4>
            <nav className="flex flex-col gap-2.5">
              {categories.map((c: any) => (
                <Link key={c.id} to={`/tests?category=${encodeURIComponent(c.name)}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {c.name}
                </Link>
              ))}
              {categories.length === 0 && (
                <span className="text-sm text-muted-foreground">Loading...</span>
              )}
            </nav>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Contact Info</h4>
            <div className="flex flex-col gap-3">
              <a href={`tel:${businessInfo.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4 shrink-0" /> {businessInfo.phone}
              </a>
              <a href={`mailto:${businessInfo.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4 shrink-0" /> {businessInfo.email}
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" /> {businessInfo.hours}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" /> {businessInfo.address}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Emerald Medical Care. All rights reserved.</span>
          <VisitorTracker />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
