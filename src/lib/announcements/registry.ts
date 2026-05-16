/**
 * Open-vocabulary registry of announcement types.
 *
 * Adding a new type = adding an entry here (and optionally a dedicated renderer).
 * Types whose key is not in the registry still render via BaseRenderer + a fallback
 * preset, so the system never breaks on an unknown type.
 */
import { z } from "zod";
import type { Severity, Placement, FrequencyStrategy, TriggerType } from "./schemas";

export interface TypePreset {
  /** Lucide icon name. */
  icon: string;
  /** Tailwind-friendly accent (CSS color or theme token). Used in BaseRenderer. */
  accent: string;
  /** Default badge label rendered when admin doesn't set one. */
  badgeLabel?: string;
  /** Default severity when this type is chosen in the admin form. */
  defaultSeverity: Severity;
  /** Default placements (admin can override). */
  defaultPlacements: Placement[];
  /** Default frequency strategy (admin can override). */
  defaultFrequency: FrequencyStrategy;
  /** Default trigger type. */
  defaultTrigger: TriggerType;
  /** Default exclusive flag (true preempts other non-exclusive items in same placement). */
  defaultExclusive: boolean;
  /** Optional zod schema for type-specific metadata. Admin form auto-renders these fields. */
  metadataSchema?: z.ZodTypeAny;
  /** Pretty label for admin dropdowns. */
  label: string;
  /** Short description shown in the admin "type" dropdown. */
  description: string;
}

const fertilityMetadata = z.object({
  doctor_name: z.string().optional(),
  credentials: z.string().optional(),
  role: z.string().optional(),
  organisation: z.string().optional(),
  brand_logo_url: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  experience: z.string().optional(),
  visit_label: z.string().optional(),
  is_free: z.boolean().optional(),
  badge_label: z.string().optional(),
  specialist_badge: z.string().optional(),
  couples_helped_stat: z.string().optional(),
  free_offer_message: z.string().optional(),
  urgency_label: z.string().optional(),
});

const discountMetadata = z.object({
  percent: z.number().optional(),
  code: z.string().optional(),
  expires_at: z.string().optional(),
  min_order: z.number().optional(),
});

const campMetadata = z.object({
  location: z.string().optional(),
  date_label: z.string().optional(),
  slots_total: z.number().optional(),
  slots_remaining: z.number().optional(),
  contact_phone: z.string().optional(),
});

/** Registry. Order here is preserved in admin "type" dropdown. */
export const ANNOUNCEMENT_TYPES: Record<string, TypePreset> = {
  discount: {
    label: "Discount / Offer",
    description: "Percentage off, promo code, time-limited deal",
    icon: "Tag",
    accent: "#ef4444",
    badgeLabel: "OFFER",
    defaultSeverity: "notice",
    defaultPlacements: ["top_bar"],
    defaultFrequency: "once_per_day",
    defaultTrigger: "on_load",
    defaultExclusive: false,
    metadataSchema: discountMetadata,
  },
  festive: {
    label: "Festive / Seasonal",
    description: "Festival greeting, seasonal campaign",
    icon: "Sparkles",
    accent: "#f59e0b",
    badgeLabel: "FESTIVE",
    defaultSeverity: "info",
    defaultPlacements: ["top_bar"],
    defaultFrequency: "once_per_session",
    defaultTrigger: "on_load",
    defaultExclusive: false,
  },
  visiting_doctor: {
    label: "Visiting Doctor",
    description: "Visiting specialist or guest physician",
    icon: "Stethoscope",
    accent: "#10b981",
    badgeLabel: "VISITING SPECIALIST",
    defaultSeverity: "notice",
    defaultPlacements: ["popup", "top_bar"],
    defaultFrequency: "once_per_day",
    defaultTrigger: "delay",
    defaultExclusive: false,
    metadataSchema: fertilityMetadata,
  },
  camp: {
    label: "Health Camp",
    description: "Free or paid medical camp with limited slots",
    icon: "Tent",
    accent: "#06b6d4",
    badgeLabel: "HEALTH CAMP",
    defaultSeverity: "notice",
    defaultPlacements: ["home_section", "top_bar"],
    defaultFrequency: "once_per_day",
    defaultTrigger: "on_load",
    defaultExclusive: false,
    metadataSchema: campMetadata,
  },
  general: {
    label: "General / Info",
    description: "Plain announcement",
    icon: "Info",
    accent: "#3b82f6",
    defaultSeverity: "info",
    defaultPlacements: ["top_bar"],
    defaultFrequency: "always",
    defaultTrigger: "on_load",
    defaultExclusive: false,
  },
  service_alert: {
    label: "Service Update / Closure",
    description: "Operational changes, holiday hours",
    icon: "AlertTriangle",
    accent: "#f97316",
    badgeLabel: "SERVICE UPDATE",
    defaultSeverity: "warning",
    defaultPlacements: ["top_bar"],
    defaultFrequency: "always",
    defaultTrigger: "on_load",
    defaultExclusive: false,
  },
  emergency_alert: {
    label: "Emergency Alert",
    description: "Service unavailable, urgent notice",
    icon: "Siren",
    accent: "#dc2626",
    badgeLabel: "URGENT",
    defaultSeverity: "critical",
    defaultPlacements: ["top_bar", "popup"],
    defaultFrequency: "always",
    defaultTrigger: "on_load",
    defaultExclusive: true,
  },
  maintenance: {
    label: "Maintenance Notice",
    description: "Planned downtime",
    icon: "Wrench",
    accent: "#64748b",
    badgeLabel: "MAINTENANCE",
    defaultSeverity: "warning",
    defaultPlacements: ["top_bar"],
    defaultFrequency: "always",
    defaultTrigger: "on_load",
    defaultExclusive: false,
  },
  new_service: {
    label: "New Service",
    description: "New department, test, or feature launched",
    icon: "Rocket",
    accent: "#8b5cf6",
    badgeLabel: "NEW",
    defaultSeverity: "info",
    defaultPlacements: ["home_section"],
    defaultFrequency: "once_per_day",
    defaultTrigger: "on_load",
    defaultExclusive: false,
  },
  reminder: {
    label: "Reminder",
    description: "Appointment / health reminder",
    icon: "Bell",
    accent: "#f59e0b",
    defaultSeverity: "info",
    defaultPlacements: ["corner_toast"],
    defaultFrequency: "once_per_day",
    defaultTrigger: "delay",
    defaultExclusive: false,
  },
  followup: {
    label: "Follow-up",
    description: "Revisit / checkup nudge",
    icon: "CalendarClock",
    accent: "#0ea5e9",
    defaultSeverity: "info",
    defaultPlacements: ["corner_toast"],
    defaultFrequency: "once_per_day",
    defaultTrigger: "delay",
    defaultExclusive: false,
  },
  membership: {
    label: "Membership / Plan",
    description: "Subscription or membership offer",
    icon: "Crown",
    accent: "#a855f7",
    badgeLabel: "MEMBERSHIP",
    defaultSeverity: "info",
    defaultPlacements: ["home_section"],
    defaultFrequency: "once_per_day",
    defaultTrigger: "on_load",
    defaultExclusive: false,
  },
  referral: {
    label: "Referral / Invite",
    description: "Invite & earn",
    icon: "Gift",
    accent: "#ec4899",
    badgeLabel: "REFER & EARN",
    defaultSeverity: "info",
    defaultPlacements: ["popup"],
    defaultFrequency: "once_per_session",
    defaultTrigger: "scroll_percent",
    defaultExclusive: false,
  },
  awareness: {
    label: "Awareness Campaign",
    description: "Health awareness, public education",
    icon: "Heart",
    accent: "#e11d48",
    defaultSeverity: "info",
    defaultPlacements: ["home_section"],
    defaultFrequency: "always",
    defaultTrigger: "on_load",
    defaultExclusive: false,
  },
  seasonal: {
    label: "Seasonal Health Alert",
    description: "Flu season, dengue alert, etc.",
    icon: "Thermometer",
    accent: "#0d9488",
    defaultSeverity: "notice",
    defaultPlacements: ["top_bar"],
    defaultFrequency: "once_per_day",
    defaultTrigger: "on_load",
    defaultExclusive: false,
  },
  event: {
    label: "Event / Webinar",
    description: "Webinar, workshop, special event",
    icon: "CalendarDays",
    accent: "#0284c7",
    badgeLabel: "EVENT",
    defaultSeverity: "info",
    defaultPlacements: ["home_section"],
    defaultFrequency: "once_per_day",
    defaultTrigger: "on_load",
    defaultExclusive: false,
  },
  result_ready: {
    label: "Reports Ready",
    description: "Test reports available",
    icon: "FileCheck",
    accent: "#16a34a",
    defaultSeverity: "info",
    defaultPlacements: ["corner_toast"],
    defaultFrequency: "once_per_session",
    defaultTrigger: "delay",
    defaultExclusive: false,
  },
  policy_update: {
    label: "Policy Update",
    description: "Hospital rules / policy change",
    icon: "ScrollText",
    accent: "#475569",
    defaultSeverity: "notice",
    defaultPlacements: ["top_bar"],
    defaultFrequency: "once_per_day",
    defaultTrigger: "on_load",
    defaultExclusive: false,
  },
  feedback_request: {
    label: "Feedback Request",
    description: "Rate your visit",
    icon: "MessageCircle",
    accent: "#0891b2",
    defaultSeverity: "info",
    defaultPlacements: ["corner_toast"],
    defaultFrequency: "once_ever",
    defaultTrigger: "scroll_percent",
    defaultExclusive: false,
  },
  onboarding: {
    label: "Onboarding",
    description: "New user guidance",
    icon: "Compass",
    accent: "#7c3aed",
    defaultSeverity: "info",
    defaultPlacements: ["popup"],
    defaultFrequency: "once_ever",
    defaultTrigger: "delay",
    defaultExclusive: false,
  },
  milestone: {
    label: "Milestone",
    description: "Achievement / celebration",
    icon: "Trophy",
    accent: "#eab308",
    defaultSeverity: "info",
    defaultPlacements: ["home_section"],
    defaultFrequency: "once_per_day",
    defaultTrigger: "on_load",
    defaultExclusive: false,
  },
  urgent_callout: {
    label: "Urgent Call-out",
    description: "High-urgency CTA",
    icon: "Megaphone",
    accent: "#dc2626",
    badgeLabel: "URGENT",
    defaultSeverity: "warning",
    defaultPlacements: ["top_bar", "popup"],
    defaultFrequency: "once_per_session",
    defaultTrigger: "on_load",
    defaultExclusive: false,
  },
};

/** Fallback preset for unknown types. */
export const FALLBACK_PRESET: TypePreset = {
  label: "Custom",
  description: "Custom announcement type",
  icon: "Megaphone",
  accent: "#3b82f6",
  defaultSeverity: "info",
  defaultPlacements: ["top_bar"],
  defaultFrequency: "always",
  defaultTrigger: "on_load",
  defaultExclusive: false,
};

export function getTypePreset(type: string): TypePreset {
  return ANNOUNCEMENT_TYPES[type] ?? FALLBACK_PRESET;
}

export function listAnnouncementTypes(): { key: string; preset: TypePreset }[] {
  return Object.entries(ANNOUNCEMENT_TYPES).map(([key, preset]) => ({ key, preset }));
}
