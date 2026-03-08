import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "promo-banner-dismissed";

const PromoBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
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
          <div className="container flex items-center justify-center gap-2 py-2.5 text-center text-sm font-medium">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>Free Home Sample Collection for a Limited Time!</span>
            <button onClick={dismiss} className="ml-2 rounded-full p-0.5 hover:bg-primary-foreground/20 transition-colors" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PromoBanner;
