import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  type Announcement,
  type Placement,
  dismiss as dismissStored,
  recordImpression,
  useTriggerReady,
  track,
} from "@/lib/announcements";
import { usePlacementAnnouncements, useAnnouncementCtx } from "../AnnouncementProvider";
import { AnnouncementCornerToastContent } from "../content/AnnouncementCornerToastContent";
import ErrorBoundary from "@/components/ErrorBoundary";

const placement: Placement = "corner_toast";

function ToastItem({ announcement: a }: { announcement: Announcement }) {
  const ready = useTriggerReady(a, placement);
  const { dismissLocal, device } = useAnnouncementCtx();
  const [visible, setVisible] = useState(true);
  const variant = a.presentation?.[placement]?.variant ?? "bottom_right";

  useEffect(() => {
    if (ready && visible) {
      recordImpression(a, placement);
      track("impression", a, placement, { device });
    }
  }, [ready, visible, a, device]);

  if (!ready || !visible) return null;

  const onDismiss = () => {
    dismissStored(a, placement);
    dismissLocal(a.id, a.version, placement);
    track("dismiss", a, placement, { device });
    setVisible(false);
  };

  const positionCls =
    variant === "bottom_left" ? "left-4 bottom-20 md:bottom-4" : "right-4 bottom-20 md:bottom-4";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className={`fixed z-50 ${positionCls} max-w-sm w-[calc(100%-2rem)] rounded-lg border bg-background shadow-lg`}
      role="status"
      aria-live="polite"
    >
      <AnnouncementCornerToastContent
        announcement={a}
        placement={placement}
        onDismiss={onDismiss}
        onCta={(which) => track(which === "primary" ? "cta_primary" : "cta_secondary", a, placement, { device })}
      />
    </motion.div>
  );
}

export function AnnouncementCornerToast() {
  const items = usePlacementAnnouncements(placement);
  const first = items[0];
  if (!first) return null;
  return (
    <ErrorBoundary>
      <AnimatePresence>
        <ToastItem key={`${first.id}:${first.version}`} announcement={first} />
      </AnimatePresence>
    </ErrorBoundary>
  );
}

export default AnnouncementCornerToast;
