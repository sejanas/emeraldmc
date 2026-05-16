import { useEffect } from "react";
import {
  type Announcement,
  type Placement,
  recordImpression,
  track,
  DEFAULT_ANNOUNCEMENT_SYSTEM,
} from "@/lib/announcements";
import { usePlacementAnnouncements, useAnnouncementCtx } from "../AnnouncementProvider";
import { AnnouncementCard } from "../AnnouncementCard";
import ErrorBoundary from "@/components/ErrorBoundary";
import SectionHeading from "@/components/SectionHeading";

const placement: Placement = "home_section";

function HomeCard({ announcement: a }: { announcement: Announcement }) {
  const { device } = useAnnouncementCtx();

  useEffect(() => {
    recordImpression(a, placement);
    track("impression", a, placement, { device });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnnouncementCard
      announcement={a}
      placement={placement}
      onCta={(which) =>
        track(which === "primary" ? "cta_primary" : "cta_secondary", a, placement, { device })
      }
      className="h-full"
    />
  );
}

/**
 * Home-section render: appears as a homepage section when included in
 * AdminHomepageSections "announcements". Returns null when there is nothing
 * to show so the surrounding layout collapses cleanly.
 */
export function AnnouncementHomeSection() {
  const items = usePlacementAnnouncements(placement);
  const visible = items.slice(0, DEFAULT_ANNOUNCEMENT_SYSTEM.max_home_section_visible);
  if (visible.length === 0) return null;

  return (
    <ErrorBoundary>
      <section className="container py-8 md:py-12">
        <SectionHeading
          title="Announcements"
          subtitle="Latest updates from Emerald Diagnostics"
        />
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((a) => (
            <HomeCard key={`${a.id}:${a.version}`} announcement={a} />
          ))}
        </div>
      </section>
    </ErrorBoundary>
  );
}

export default AnnouncementHomeSection;
