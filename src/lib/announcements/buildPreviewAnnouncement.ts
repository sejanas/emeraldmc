import type { Announcement, Placement } from "./schemas";

export interface PreviewTheme {
  accent: string;
  background: string;
  text: string;
  badgeStyle: string;
  density: "compact" | "comfortable";
}

export interface BuildPreviewAnnouncementInput {
  type: string;
  title: string;
  body: string;
  imageUrl?: string;
  icon?: string | null;
  severity: string;
  metadata?: Record<string, unknown>;
  primaryCtaLabel?: string;
  primaryCtaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  placement: Placement;
  variant?: string;
  theme: PreviewTheme;
  startAt?: string;
  endAt?: string;
}

/** Build a full Announcement row for admin previews (WYSIWYG with live components). */
export function buildPreviewAnnouncement(input: BuildPreviewAnnouncementInput): Announcement {
  const {
    type,
    title,
    body,
    imageUrl,
    icon,
    severity,
    metadata = {},
    primaryCtaLabel,
    primaryCtaUrl,
    secondaryCtaLabel,
    secondaryCtaUrl,
    placement,
    variant,
    theme,
    startAt,
    endAt,
  } = input;

  return {
    id: "00000000-0000-4000-8000-000000000000",
    schema_version: 1,
    version: 1,
    type,
    title: title || "Announcement title",
    body,
    image_url: imageUrl || null,
    icon: icon || null,
    placements: [placement],
    presentation: variant ? { [placement]: { variant } } : {},
    severity: severity as Announcement["severity"],
    priority: 0,
    exclusive: false,
    frequency: { strategy: "always" },
    trigger: { type: "on_load" },
    page_rules: {},
    devices: ["mobile", "tablet", "desktop"],
    audience: ["all"],
    theme: {
      accent_color: theme.accent,
      background_color: theme.background,
      text_color: theme.text,
      badge_style: theme.badgeStyle,
      layout_density: theme.density,
    },
    primary_cta_label: primaryCtaLabel || null,
    primary_cta_url: primaryCtaUrl || (primaryCtaLabel ? "/book" : null),
    secondary_cta_label: secondaryCtaLabel || null,
    secondary_cta_url: secondaryCtaUrl || (secondaryCtaLabel ? "/faq" : null),
    metadata,
    dismissible: true,
    is_active: true,
    start_at: startAt || null,
    end_at: endAt || null,
  };
}
