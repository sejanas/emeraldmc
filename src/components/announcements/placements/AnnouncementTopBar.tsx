import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  type Announcement,
  type Placement,
  dismiss as dismissStored,
  recordImpression,
  useTriggerReady,
  track,
  DEFAULT_ANNOUNCEMENT_SYSTEM,
} from "@/lib/announcements";
import { usePlacementAnnouncements, useAnnouncementCtx } from "../AnnouncementProvider";
import { AnnouncementTopBarContent } from "../content/AnnouncementTopBarContent";
import ErrorBoundary from "@/components/ErrorBoundary";

const placement: Placement = "top_bar";

function TopBarItem({ announcement: a }: { announcement: Announcement }) {
  const ready = useTriggerReady(a, placement);
  const { dismissLocal, device } = useAnnouncementCtx();
  const [visible, setVisible] = useState(true);

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

  const onCta = (which: "primary" | "secondary") => {
    track(which === "primary" ? "cta_primary" : "cta_secondary", a, placement, { device });
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
    >
      <AnnouncementTopBarContent
        announcement={a}
        placement={placement}
        onDismiss={onDismiss}
        onCta={onCta}
      />
    </motion.div>
  );
}

export function AnnouncementTopBar() {
  const items = usePlacementAnnouncements(placement);
  const visible = items.slice(0, DEFAULT_ANNOUNCEMENT_SYSTEM.max_top_bar_visible);
  if (visible.length === 0) return null;

  return (
    <ErrorBoundary>
      <AnimatePresence>
        {visible.map((a) => (
          <TopBarItem key={`${a.id}:${a.version}`} announcement={a} />
        ))}
      </AnimatePresence>
    </ErrorBoundary>
  );
}

export default AnnouncementTopBar;
