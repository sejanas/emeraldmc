import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Announcement, Placement } from "@/lib/announcements";
import { PLACEMENT_VARIANTS } from "@/lib/announcements";
import { AnnouncementCard } from "./AnnouncementCard";
import { AnnouncementTopBarContent } from "./content/AnnouncementTopBarContent";
import { AnnouncementPopupContent } from "./content/AnnouncementPopupContent";
import { VisitingDoctorPanel } from "./content/VisitingDoctorPanel";
import { AnnouncementCornerToastContent } from "./content/AnnouncementCornerToastContent";

export interface AnnouncementPlacementPreviewProps {
  announcement: Announcement;
  placement: Placement;
  /** Scale down for look-preset thumbnails */
  compact?: boolean;
}

/**
 * Renders the same UI components as the live site, wrapped for admin preview context.
 */
export function AnnouncementPlacementPreview({
  announcement,
  placement,
  compact,
}: AnnouncementPlacementPreviewProps) {
  const variant = announcement.presentation?.[placement]?.variant ?? PLACEMENT_VARIANTS[placement][0];

  const wrap = (children: ReactNode, className?: string) => (
    <div
      className={cn(
        "pointer-events-none",
        compact && "origin-top scale-[0.92]",
        className,
      )}
    >
      {children}
    </div>
  );

  if (placement === "top_bar") {
    return wrap(
      <div className="overflow-hidden rounded-md">
        <AnnouncementTopBarContent
          announcement={announcement}
          placement={placement}
          showDismiss={false}
        />
        {variant === "ticker" && (
          <p className="mt-1 text-center text-[10px] text-muted-foreground">Ticker scrolls on the live site</p>
        )}
      </div>,
    );
  }

  if (placement === "popup") {
    if (announcement.type === "visiting_doctor") {
      return wrap(
        <div className="rounded-lg border bg-background max-h-[min(85vh,720px)] overflow-y-auto overscroll-contain">
          <VisitingDoctorPanel announcement={announcement} />
        </div>,
        "max-w-3xl w-full",
      );
    }
    return wrap(
      <div className="overflow-hidden rounded-lg border bg-background max-w-lg">
        <AnnouncementPopupContent announcement={announcement} />
      </div>,
    );
  }

  if (placement === "corner_toast") {
    const align = variant === "bottom_left" ? "justify-start" : "justify-end";
    return wrap(
      <div className={cn("flex", align)}>
        <div className="max-w-sm w-full rounded-lg border bg-background shadow-lg">
          <AnnouncementCornerToastContent announcement={announcement} showDismiss={false} />
        </div>
      </div>,
    );
  }

  if (placement === "home_section" || placement === "inline") {
    return wrap(
      <AnnouncementCard
        announcement={announcement}
        placement={placement}
        compact={compact}
        onDismiss={placement === "inline" ? () => {} : undefined}
      />,
    );
  }

  return wrap(
    <div className="overflow-hidden rounded-lg border bg-background max-w-lg">
      <AnnouncementPopupContent announcement={announcement} />
    </div>,
  );
}
