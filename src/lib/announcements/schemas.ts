/**
 * Shared zod schemas for announcements.
 *
 * Imported by:
 *   - Edge function: supabase/functions/api/index.ts (write validation + sanitization)
 *   - Client: AnnouncementProvider (read validation with .catch() defaults), admin form
 *
 * Every jsonb field has a schema with safe defaults so a malformed row never crashes
 * the renderer. New fields should be added with `.default(...)` to stay backward
 * compatible with v1 rows; bump the row's `schema_version` column when a shape
 * change requires data migration.
 */
import { z } from "zod";

// ── Allowlists ──────────────────────────────────────────────────────────────

export const PLACEMENTS = ["top_bar", "popup", "home_section", "corner_toast", "inline"] as const;
export type Placement = typeof PLACEMENTS[number];

export const SEVERITIES = ["info", "notice", "warning", "critical"] as const;
export type Severity = typeof SEVERITIES[number];

export const DEVICES = ["mobile", "tablet", "desktop"] as const;
export type Device = typeof DEVICES[number];

export const AUDIENCES = ["all", "new", "returning", "authenticated", "guest"] as const;
export type Audience = typeof AUDIENCES[number];

export const FREQUENCY_STRATEGIES = [
  "always",
  "once_ever",
  "once_per_session",
  "once_per_day",
  "cooldown",
  "max_impressions",
] as const;
export type FrequencyStrategy = typeof FREQUENCY_STRATEGIES[number];

export const TRIGGER_TYPES = [
  "on_load",
  "delay",
  "scroll_percent",
  "idle",
  "exit_intent",
  "route_match",
] as const;
export type TriggerType = typeof TRIGGER_TYPES[number];

/** Variant allowlist per placement — must match what placement components render. */
export const PLACEMENT_VARIANTS: Record<Placement, readonly string[]> = {
  top_bar: ["slim_strip", "ticker"],
  popup: ["center_modal"],
  home_section: ["card"],
  corner_toast: ["bottom_right", "bottom_left"],
  inline: ["card"],
};

/** Cap inline placement list length (single-column stack; no carousel). */
export const MAX_INLINE_ANNOUNCEMENTS_VISIBLE = 3;

export const LAYOUTS = ["image_left", "image_top", "image_right", "icon_only", "text_only"] as const;
export const SIZES = ["sm", "md", "lg"] as const;
export const BADGE_STYLES = ["solid", "outline", "soft"] as const;
export const LAYOUT_DENSITIES = ["compact", "comfortable"] as const;

// ── Color validation (defense against arbitrary style injection) ─────────────

const colorSchema = z
  .string()
  .regex(/^(#([0-9a-f]{3}|[0-9a-f]{6})|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)|hsl\(.*\))$/i, {
    message: "Color must be a hex, rgb, rgba, or hsl string",
  })
  .optional()
  .nullable();

// ── URL validation (blocks javascript:, data:, etc.) ────────────────────────

const safeUrlSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true;
      const lower = val.trim().toLowerCase();
      // Block dangerous schemes
      if (lower.startsWith("javascript:")) return false;
      if (lower.startsWith("data:")) return false;
      if (lower.startsWith("vbscript:")) return false;
      // Allowed: relative paths, https, http (for backwards compat), mailto, tel, anchors
      return (
        val.startsWith("/") ||
        val.startsWith("#") ||
        lower.startsWith("https://") ||
        lower.startsWith("http://") ||
        lower.startsWith("mailto:") ||
        lower.startsWith("tel:")
      );
    },
    { message: "URL must be relative (/...), https:, http:, mailto:, or tel:" },
  )
  .optional()
  .nullable();

// ── Trigger ─────────────────────────────────────────────────────────────────

export const triggerSchema = z
  .object({
    type: z.enum(TRIGGER_TYPES).default("on_load"),
    /**
     * For delay → ms, scroll_percent → 5–95, idle → seconds,
     * route_match → undefined (paths come from page_rules).
     */
    value: z.number().optional(),
  })
  .catch({ type: "on_load" });

export type Trigger = z.infer<typeof triggerSchema>;

// ── Per-placement presentation ──────────────────────────────────────────────

export const placementPresentationSchema = z
  .object({
    variant: z.string().optional(),
    layout: z.enum(LAYOUTS).optional(),
    size: z.enum(SIZES).optional(),
    /** Per-placement trigger override; falls back to row-level `trigger`. */
    trigger: triggerSchema.optional(),
    /** When set, limits this placement to these paths (exact or glob). Empty = all pages (after global page_rules). */
    pages: z.array(z.string()).optional(),
  })
  .catch({});

export type PlacementPresentation = z.infer<typeof placementPresentationSchema>;

/** presentation jsonb: keyed by placement. Missing keys fall back to defaults. */
export const presentationSchema = z
  .record(z.string(), placementPresentationSchema)
  .catch({});

export type Presentation = z.infer<typeof presentationSchema>;

// ── Frequency ───────────────────────────────────────────────────────────────

export const frequencySchema = z
  .object({
    strategy: z.enum(FREQUENCY_STRATEGIES).default("always"),
    cooldown_hours: z.number().int().min(1).max(8760).optional(),
    max_impressions: z.number().int().min(1).max(1000).optional(),
  })
  .catch({ strategy: "always" });

export type Frequency = z.infer<typeof frequencySchema>;

// ── Page rules (UX filter, NOT a security control) ──────────────────────────

export const pageRulesSchema = z
  .object({
    include: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
  })
  .catch({});

export type PageRules = z.infer<typeof pageRulesSchema>;

// ── Schedule ────────────────────────────────────────────────────────────────

export const timeWindowSchema = z
  .object({
    /** "HH:mm" 24-hour. */
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
    /** IANA timezone name. */
    timezone: z.string().min(1),
    /** 0 = Sunday … 6 = Saturday. Empty = every day. */
    days_of_week: z.array(z.number().int().min(0).max(6)).optional(),
  })
  .catch(undefined as any);

export type TimeWindow = z.infer<typeof timeWindowSchema>;

// ── Theme ───────────────────────────────────────────────────────────────────

export const themeSchema = z
  .object({
    accent_color: colorSchema,
    background_color: colorSchema,
    text_color: colorSchema,
    badge_style: z.enum(BADGE_STYLES).optional(),
    layout_density: z.enum(LAYOUT_DENSITIES).optional(),
    dark_mode_overrides: z
      .object({
        accent_color: colorSchema,
        background_color: colorSchema,
        text_color: colorSchema,
      })
      .optional(),
  })
  .catch({});

export type Theme = z.infer<typeof themeSchema>;

// ── System settings (announcement_system in site_settings) ──────────────────

export const announcementSystemSettingSchema = z
  .object({
    enabled: z.boolean().default(true),
    enabled_placements: z.array(z.enum(PLACEMENTS)).default([...PLACEMENTS]),
    debug_mode: z.boolean().default(false),
    max_popups_per_session: z.number().int().min(0).max(10).default(2),
    min_seconds_between_popups: z.number().int().min(0).max(3600).default(30),
    max_top_bar_visible: z.number().int().min(1).max(10).default(3),
    max_home_section_visible: z.number().int().min(1).max(20).default(6),
    max_corner_toasts_concurrent: z.number().int().min(1).max(5).default(1),
    default_timezone: z.string().default("Asia/Kolkata"),
    image_url_allowlist: z.array(z.string()).default([]),
  })
  .catch({} as any);

export type AnnouncementSystemSetting = z.infer<typeof announcementSystemSettingSchema>;

export const DEFAULT_ANNOUNCEMENT_SYSTEM: AnnouncementSystemSetting = {
  enabled: true,
  enabled_placements: [...PLACEMENTS],
  debug_mode: false,
  max_popups_per_session: 2,
  min_seconds_between_popups: 30,
  max_top_bar_visible: 3,
  max_home_section_visible: 6,
  max_corner_toasts_concurrent: 1,
  default_timezone: "Asia/Kolkata",
  image_url_allowlist: [],
};

// ── Full announcement row (for parsing on read) ─────────────────────────────

export const announcementRowSchema = z.object({
  id: z.string().uuid(),
  schema_version: z.number().int().default(1),
  version: z.number().int().default(1),
  type: z.string(),
  title: z.string().default(""),
  body: z.string().default(""),
  image_url: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  placements: z.array(z.string()).default([]),
  presentation: presentationSchema,
  severity: z.enum(SEVERITIES).default("info"),
  priority: z.number().int().default(0),
  exclusive: z.boolean().default(false),
  frequency: frequencySchema,
  trigger: triggerSchema,
  page_rules: pageRulesSchema,
  devices: z.array(z.enum(DEVICES)).default([...DEVICES]),
  audience: z.array(z.enum(AUDIENCES)).default(["all"]),
  start_at: z.string().nullable().optional(),
  end_at: z.string().nullable().optional(),
  time_window: timeWindowSchema.nullable().optional(),
  theme: themeSchema,
  primary_cta_label: z.string().nullable().optional(),
  primary_cta_url: z.string().nullable().optional(),
  secondary_cta_label: z.string().nullable().optional(),
  secondary_cta_url: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  dismissible: z.boolean().default(true),
  is_active: z.boolean().default(true),
  variant_group: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  paused_at: z.string().nullable().optional(),
});

export type Announcement = z.infer<typeof announcementRowSchema>;

// ── Write validation (admin POST/PUT) ───────────────────────────────────────

export const announcementWriteSchema = z.object({
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  body: z.string().max(5000).default(""),
  image_url: safeUrlSchema,
  icon: z.string().max(50).nullable().optional(),
  placements: z.array(z.enum(PLACEMENTS)).min(1, "At least one placement required"),
  presentation: presentationSchema.default({}),
  severity: z.enum(SEVERITIES).default("info"),
  priority: z.number().int().min(-1000).max(1000).default(0),
  exclusive: z.boolean().default(false),
  frequency: frequencySchema.default({ strategy: "always" }),
  trigger: triggerSchema.default({ type: "on_load" }),
  page_rules: pageRulesSchema.default({}),
  devices: z.array(z.enum(DEVICES)).default([...DEVICES]),
  audience: z.array(z.enum(AUDIENCES)).default(["all"]),
  start_at: z.string().nullable().optional(),
  end_at: z.string().nullable().optional(),
  time_window: timeWindowSchema.nullable().optional(),
  theme: themeSchema.default({}),
  primary_cta_label: z.string().max(100).nullable().optional(),
  primary_cta_url: safeUrlSchema,
  secondary_cta_label: z.string().max(100).nullable().optional(),
  secondary_cta_url: safeUrlSchema,
  metadata: z.record(z.string(), z.any()).default({}),
  dismissible: z.boolean().default(true),
  is_active: z.boolean().default(true),
  variant_group: z.string().max(50).nullable().optional(),
});

export type AnnouncementWrite = z.infer<typeof announcementWriteSchema>;

/** Cross-field validation that zod can't express in a single object pass. */
export function validateAnnouncementCrossFields(data: AnnouncementWrite): string | null {
  if (data.start_at && data.end_at && new Date(data.start_at) >= new Date(data.end_at)) {
    return "start_at must be before end_at";
  }

  // Each chosen placement must have a valid variant (or none, falling back to default)
  for (const placement of data.placements) {
    const presentation = data.presentation?.[placement];
    const variant = presentation?.variant;
    if (variant && !PLACEMENT_VARIANTS[placement].includes(variant)) {
      return `Invalid variant '${variant}' for placement '${placement}'. Allowed: ${PLACEMENT_VARIANTS[placement].join(", ")}`;
    }
  }

  // Frequency invariants
  if (data.frequency.strategy === "cooldown" && !data.frequency.cooldown_hours) {
    return "frequency.cooldown_hours is required when strategy is 'cooldown'";
  }
  if (data.frequency.strategy === "max_impressions" && !data.frequency.max_impressions) {
    return "frequency.max_impressions is required when strategy is 'max_impressions'";
  }

  // Trigger invariants
  if (data.trigger.type === "delay" && (data.trigger.value == null || data.trigger.value < 0)) {
    return "trigger.value (ms ≥ 0) is required when trigger.type is 'delay'";
  }
  if (data.trigger.type === "scroll_percent") {
    const v = data.trigger.value;
    if (v == null || v < 5 || v > 95) {
      return "trigger.value must be between 5 and 95 when trigger.type is 'scroll_percent'";
    }
  }
  if (data.trigger.type === "idle" && (data.trigger.value == null || data.trigger.value < 1)) {
    return "trigger.value (seconds ≥ 1) is required when trigger.type is 'idle'";
  }

  // Time window: same-day only
  if (data.time_window) {
    const [sh, sm] = data.time_window.start_time.split(":").map(Number);
    const [eh, em] = data.time_window.end_time.split(":").map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      return "time_window.start_time must be before end_time (overnight requires two windows)";
    }
  }

  return null;
}

// ── Event payload (analytics) ───────────────────────────────────────────────

export const eventTypeSchema = z.enum([
  "impression",
  "engagement",
  "click",
  "cta_primary",
  "cta_secondary",
  "dismiss",
  "auto_hide",
]);

export const announcementEventSchema = z.object({
  announcement_id: z.string().uuid(),
  announcement_version: z.number().int(),
  variant_group: z.string().nullable().optional(),
  event_type: eventTypeSchema,
  placement: z.enum(PLACEMENTS),
  session_id: z.string().nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
  page_path: z.string().nullable().optional(),
  device: z.enum(DEVICES).nullable().optional(),
});

export type AnnouncementEvent = z.infer<typeof announcementEventSchema>;
