import { Link } from "react-router-dom";
import { Phone, Mail, Clock, MapPin } from "lucide-react";
import { businessInfo } from "@/data/siteData";
import VisitorTracker from "@/components/VisitorTracker";

const Footer = () => (
  <footer className="border-t border-border bg-muted/50">
    <div className="container py-12">
      <div className="grid gap-8 md:grid-cols-4">
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
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Quick Links</h4>
          <nav className="flex flex-col gap-2">
            {[
              { to: "/tests", label: "Our Tests" },
              { to: "/packages", label: "Health Packages" },
              { to: "/doctors", label: "Our Doctors" },
              { to: "/book", label: "Book Appointment" },
              { to: "/contact", label: "Contact Us" },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Test Categories</h4>
          <nav className="flex flex-col gap-2">
            {["Hematology", "Thyroid", "Diabetes", "Lipid Profile", "Liver Function"].map((c) => (
              <Link key={c} to="/tests" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {c}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Contact Info</h4>
          <div className="flex flex-col gap-3">
            <a href={`tel:${businessInfo.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <Phone className="h-4 w-4 shrink-0" /> {businessInfo.phone}
            </a>
            <a href={`mailto:${businessInfo.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
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

      <div className="mt-8 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Emerald Medical Care. All rights reserved. | ISO Certified Lab in Sri Vijaya Puram</span>
        <VisitorTracker />
      </div>
    </div>
  </footer>
);

export default Footer;
