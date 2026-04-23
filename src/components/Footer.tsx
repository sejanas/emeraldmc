import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Mail, Clock, MapPin } from "lucide-react";
import { businessInfo } from "@/data/siteData";
import VisitorTracker from "@/components/VisitorTracker";
import useCategories from "@/hooks/useCategories";
import Logo from "@/assets/Logo";
import { useSiteSettings } from "@/hooks/useSiteSettings";

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
  const { data: allSettings } = useSiteSettings();
  const generalSettings = Array.isArray(allSettings)
    ? (allSettings.find((s: any) => s.key === "general")?.value ?? {})
    : {};
  const dynamicHours: string = generalSettings.hours || businessInfo.hours;

  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <Link to="/" className="flex items-center group">
              <Logo variant="flat" className="h-16 rounded-xl transition-transform group-hover:scale-105" />
            </Link>
            <p className="mt-2 text-xs font-medium text-primary/80 italic">Bringing World Class Care to the Islands</p>
            <p className="mt-0.5 text-xs text-muted-foreground">(A Unit of Emerald Medical Care)</p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Trusted ISO Certified Diagnostic Lab in Sri Vijaya Puram, providing quality healthcare services.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="https://www.facebook.com/profile.php?id=61588640095513" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110" aria-label="Facebook">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                </svg>
              </a>
              <a href="https://wa.me/917679348684?text=Hello%2C%20I%20want%20to%20book%20a%20health%20test." target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/shifa_health_care0/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110" aria-label="Instagram">
                <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="ig-grad-footer" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FFDC80"/>
                      <stop offset="25%" stopColor="#FCAF45"/>
                      <stop offset="50%" stopColor="#F77737"/>
                      <stop offset="75%" stopColor="#C13584"/>
                      <stop offset="100%" stopColor="#833AB4"/>
                    </linearGradient>
                  </defs>
                  <path fill="url(#ig-grad-footer)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
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
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0 mt-0.5" /> <span className="whitespace-pre-line">{dynamicHours}</span>
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
