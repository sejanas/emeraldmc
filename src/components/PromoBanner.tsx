import { useState, useEffect } from "react";
import { X, Sparkles, Stethoscope } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { VISITING_DOCTOR_EVENT, isVisitActive } from "@/data/visitingDoctorEvent";

const STORAGE_KEY = "promo-banner-dismissed";
const VISIT_STORAGE_KEY = "visiting-camp-dismissed";

const PromoBanner = () => {
  const [visible, setVisible] = useState(false);
  const visitActive = isVisitActive();

  useEffect(() => {
    const key = visitActive ? VISIT_STORAGE_KEY : STORAGE_KEY;
    const dismissed = sessionStorage.getItem(key);
    if (!dismissed) setVisible(true);
  }, [visitActive]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(visitActive ? VISIT_STORAGE_KEY : STORAGE_KEY, "1");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative overflow-hidden bg-primary text-primary-foreground"
        >
          {visitActive ? (
            <div className="container flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2.5 text-center text-sm font-medium">
              <Stethoscope className="h-4 w-4 shrink-0" />
              <span>
                <span className="font-bold">FREE Fertility Camp</span> — {VISITING_DOCTOR_EVENT.name} ({VISITING_DOCTOR_EVENT.credentials}) visiting&nbsp;
                <span className="font-bold">{VISITING_DOCTOR_EVENT.visitLabel}</span>
              </span>
              <Link to="/book?from=fertility-camp" className="underline underline-offset-2 font-semibold hover:text-primary-foreground/80 transition-colors shrink-0">
                Book Free Slot →
              </Link>
              <button onClick={dismiss} className="ml-1 rounded-full p-0.5 hover:bg-primary-foreground/20 transition-colors" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="container flex items-center justify-center gap-2 py-2.5 text-center text-sm font-medium">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Free Home Sample Collection for a Limited Time!</span>
              <button onClick={dismiss} className="ml-2 rounded-full p-0.5 hover:bg-primary-foreground/20 transition-colors" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PromoBanner;
