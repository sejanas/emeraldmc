import {
  type Placement,
  dismiss as dismissStored,
  MAX_INLINE_ANNOUNCEMENTS_VISIBLE,
  track,
} from "@/lib/announcements";
import { usePlacementAnnouncements, useAnnouncementCtx } from "../AnnouncementProvider";
import { AnnouncementCard } from "../AnnouncementCard";
import ErrorBoundary from "@/components/ErrorBoundary";

const placement: Placement = "inline";

export function AnnouncementInline() {
  const items = usePlacementAnnouncements(placement);
  const { dismissLocal, device } = useAnnouncementCtx();
  const visible = items.slice(0, MAX_INLINE_ANNOUNCEMENTS_VISIBLE);
  if (visible.length === 0) return null;

  return (
    <ErrorBoundary>
      <section className="container py-6 md:py-8 space-y-4" aria-label="Inline announcements">
        {visible.map((a) => (
          <AnnouncementCard
            key={`${a.id}:${a.version}`}
            announcement={a}
            placement={placement}
            onDismiss={() => {
              dismissStored(a, placement);
              dismissLocal(a.id, a.version, placement);
              track("dismiss", a, placement, { device });
            }}
            onCta={(which) =>
              track(which === "primary" ? "cta_primary" : "cta_secondary", a, placement, { device })
            }
          />
        ))}
      </section>
    </ErrorBoundary>
  );
}

export default AnnouncementInline;
