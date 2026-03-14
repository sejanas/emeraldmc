import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Mail, Clock, MapPin, Facebook, Instagram } from "lucide-react";
import { businessInfo } from "@/data/siteData";
import VisitorTracker from "@/components/VisitorTracker";
import useCategories from "@/hooks/useCategories";
import logo from "@/assets/logo.png";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const Footer = () => {
  const categoriesQuery = useCategories();
  const categories = (categoriesQuery.data ?? []).slice(0, 6);

  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary p-1 transition-transform group-hover:scale-110">
                <img src={logo} alt="Shifa's Mainland Healthcare" width={64} height={64} className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display text-base font-bold uppercase tracking-wide">Shifa's Mainland</span>
                <span className="font-display text-sm font-semibold uppercase tracking-wider text-primary">Healthcare</span>
              </div>
            </Link>
            <p className="mt-2 text-xs font-medium text-primary/80 italic">Bringing World Class Care to the Islands</p>
            <p className="mt-0.5 text-xs text-muted-foreground">(A Unit of Emerald Medical Care)</p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Trusted ISO Certified Diagnostic Lab in Sri Vijaya Puram, providing quality healthcare services.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="https://www.facebook.com/profile.php?id=61588640095513" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:text-primary hover:border-primary hover:scale-110" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://www.instagram.com/shifa_health_care0/" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:text-primary hover:border-primary hover:scale-110" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Quick Links</h4>
            <nav className="flex flex-col gap-2.5">
              {[
                { to: "/tests", label: "Our Tests" },
                { to: "/packages", label: "Health Packages" },
                { to: "/doctors", label: "Our Doctors" },
                { to: "/reports", label: "Download Reports" },
                { to: "/book", label: "Book Appointment" },
                { to: "/blog", label: "Health Blog" },
                { to: "/faq", label: "FAQs" },
                { to: "/contact", label: "Contact Us" },
              ].map((l) => (
                <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all">
                  {l.label}
                </Link>
              ))}
            </nav>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Test Categories</h4>
            <nav className="flex flex-col gap-2.5">
              {categories.map((c: any) => (
                <Link key={c.id} to={`/tests?category=${encodeURIComponent(c.name)}`} className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all">
                  {c.name}
                </Link>
              ))}
              {categories.length === 0 && (
                <span className="text-sm text-muted-foreground">Loading...</span>
              )}
            </nav>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}>
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
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground"
        >
          <span>© {new Date().getFullYear()} Shifa's Mainland Healthcare (A Unit of Emerald Medical Care). All rights reserved.</span>
          <VisitorTracker />
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
