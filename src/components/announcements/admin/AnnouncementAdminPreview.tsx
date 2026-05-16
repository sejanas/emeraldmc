import { useMemo } from "react";
import { getTypePreset, type Placement } from "@/lib/announcements";
import {
  buildPreviewAnnouncement,
  type PreviewTheme,
  type BuildPreviewAnnouncementInput,
} from "@/lib/announcements/buildPreviewAnnouncement";
import { AnnouncementPlacementPreview } from "../AnnouncementPlacementPreview";

export type { PreviewTheme };

export interface AnnouncementAdminPreviewProps extends BuildPreviewAnnouncementInput {
  severity: string;
  metadata: Record<string, unknown>;
  compact?: boolean;
}

/** Plain-text excerpt for labels (legacy helper). */
export function bodyPreviewText(bodyHtml: string, maxLen = 120): string {
  const plain = bodyHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen).trim()}…`;
}

export function AnnouncementAdminPreview(props: AnnouncementAdminPreviewProps) {
  const typePreset = useMemo(() => getTypePreset(props.type), [props.type]);

  const announcement = useMemo(
    () =>
      buildPreviewAnnouncement({
        ...props,
        icon: props.icon || typePreset.icon,
      }),
    [props, typePreset.icon],
  );

  return (
    <AnnouncementPlacementPreview
      announcement={announcement}
      placement={props.placement}
      compact={props.compact}
    />
  );
}

export default AnnouncementAdminPreview;
