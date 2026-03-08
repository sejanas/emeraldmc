import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { businessInfo } from "@/data/siteData";

const MobileCTA = () => {
  const [show, setShow] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname === "/book") return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur p-3 md:hidden"
        >
          <div className="flex items-center gap-2">
            <a
              href={`tel:${businessInfo.phone}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card"
              aria-label="Call us"
            >
              <Phone className="h-4 w-4 text-primary" />
            </a>
            <Button asChild className="flex-1" size="sm">
              <Link to="/book">Book Appointment</Link>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileCTA;
