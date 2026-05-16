import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  ArchiveRestore,
  Check,
  ChevronsUpDown,
  Copy,
  Megaphone,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";
import { useConfirm } from "@/components/ConfirmDialog";
import {
  useAdminAnnouncements,
  useBulkAnnouncementAction,
  useCloneAnnouncement,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  usePauseAnnouncement,
  usePublishAnnouncement,
  useRestoreAnnouncement,
  useUpdateAnnouncement,
  type AnnouncementBulkAction,
} from "@/hooks/useAnnouncements";
import {
  type Announcement,
  type AnnouncementWrite,
  type Placement,
  announcementWriteSchema,
  validateAnnouncementCrossFields,
  PLACEMENTS,
  SEVERITIES,
  DEVICES,
  AUDIENCES,
  FREQUENCY_STRATEGIES,
  TRIGGER_TYPES,
  PLACEMENT_VARIANTS,
  ANNOUNCEMENT_TYPES,
  getTypePreset,
  getLifecycleStatus,
  LIFECYCLE_STATUSES,
  LIFECYCLE_STATUS_LABELS,
  type AnnouncementLifecycleStatus,
  PUBLIC_SITE_PAGES,
} from "@/lib/announcements";
import IconSelector from "@/components/IconSelector";
import RichTextEditor from "@/components/RichTextEditor";
import ImageUpload from "@/components/ImageUpload";
import { announcementSaveMessage } from "@/lib/error";
import AnnouncementAdminPreview from "@/components/announcements/admin/AnnouncementAdminPreview";
import type { PreviewTheme } from "@/lib/announcements";

type TriggerType = typeof TRIGGER_TYPES[number];

type MetadataFieldType = "text" | "textarea" | "number" | "boolean" | "string_array";

interface MetadataFieldDef {
  key: string;
  label: string;
  type: MetadataFieldType;
  placeholder?: string;
}

interface TypeOption {
  key: string;
  label: string;
  description: string;
  count: number;
  searchLabel: string;
}

const METADATA_FIELDS: Record<string, MetadataFieldDef[]> = {
  visiting_doctor: [
    { key: "doctor_name", label: "Doctor name", type: "text" },
    { key: "credentials", label: "Credentials", type: "text" },
    { key: "role", label: "Role / title", type: "text" },
    { key: "organisation", label: "Organisation", type: "text" },
    { key: "brand_logo_url", label: "Brand logo URL", type: "text" },
    { key: "specialist_badge", label: "Header badge (e.g. VISITING SPECIALIST)", type: "text" },
    { key: "urgency_label", label: "Urgency badge (optional; overrides schedule text)", type: "text" },
    { key: "specialties", label: "Specialties (comma separated)", type: "string_array" },
    { key: "experience", label: "Experience stat (full text)", type: "text" },
    { key: "couples_helped_stat", label: "Couples helped stat", type: "text" },
    { key: "visit_label", label: "Visit date label (on photo)", type: "text" },
    { key: "badge_label", label: "Photo badge (e.g. FREE CAMP)", type: "text" },
    { key: "is_free", label: "Show free-offer box", type: "boolean" },
    { key: "free_offer_message", label: "Free-offer box message", type: "textarea" },
  ],
  discount: [
    { key: "percent", label: "Discount percent", type: "number" },
    { key: "code", label: "Coupon code", type: "text" },
    { key: "expires_at", label: "Expiry (ISO)", type: "text", placeholder: "2026-12-31T18:30:00.000Z" },
    { key: "min_order", label: "Minimum order", type: "number" },
  ],
  camp: [
    { key: "location", label: "Location", type: "text" },
    { key: "date_label", label: "Date label", type: "text" },
    { key: "slots_total", label: "Total slots", type: "number" },
    { key: "slots_remaining", label: "Slots remaining", type: "number" },
    { key: "contact_phone", label: "Contact phone", type: "text" },
  ],
};

const METADATA_OPTIONS: Record<string, string[]> = {
  role: ["Gynaecologist & Fertility Specialist", "Senior Fertility Specialist"],
  organisation: ["The Hive Fertility & Women's Centre, Chennai"],
  credentials: ["MS OG, MRCOG (UK), FRM, FMAS, F ART"],
  experience: ["10+ years Experience", "12+ years Experience"],
  couples_helped_stat: ["1000+ Couples Helped", "500+ Families Helped"],
  specialist_badge: ["VISITING SPECIALIST", "GUEST SPECIALIST"],
  urgency_label: ["Happening now!", "Starts tomorrow!"],
  visit_label: ["Apr 25 - 26, 2026", "This weekend"],
  badge_label: ["FREE CAMP", "LIMITED SLOTS"],
  free_offer_message: [
    "Registration & consultation are completely free. Limited slots available.",
  ],
  specialties: ["IVF & ICSI, PCOD / PCOS, Endometriosis, Recurrent IVF Failures, Fertility Preservation, Laparoscopic Surgery"],
};

function metadataSuggestionLabel(opt: string, fieldKey: string): string {
  if (fieldKey === "specialties") return "Apply suggested specialty list";
  if (fieldKey === "free_offer_message") return "Apply suggested message";
  if (opt.length > 52) return `${opt.slice(0, 49)}…`;
  return opt;
}

function MetadataSuggestionChips({
  fieldKey,
  options,
  onSelect,
}: {
  fieldKey: string;
  options: string[];
  onSelect: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="rounded-md border border-dashed border-muted-foreground/25 bg-muted/30 px-2.5 py-2 space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quick fill</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            title={opt}
            onClick={() => onSelect(opt)}
            className="inline-flex max-w-full items-center rounded-md bg-background/80 px-2 py-1 text-left text-xs font-medium text-primary shadow-sm ring-1 ring-primary/20 transition-colors hover:bg-primary/10 hover:ring-primary/40"
          >
            {metadataSuggestionLabel(opt, fieldKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

const LOOK_PRESETS = [
  {
    key: "clinical_clean",
    label: "Clinical Clean",
    description: "Soft borders, clean spacing, trusted hospital style",
    theme: {
      badge_style: "soft",
      layout_density: "comfortable",
      accent_color: "#2563eb",
      background_color: "#f8fafc",
      text_color: "#0f172a",
    },
  },
  {
    key: "urgent_alert",
    label: "Urgent Alert",
    description: "High-attention style for urgent updates",
    theme: {
      badge_style: "solid",
      layout_density: "compact",
      accent_color: "#dc2626",
      background_color: "#fef2f2",
      text_color: "#7f1d1d",
    },
  },
  {
    key: "premium_event",
    label: "Premium Event",
    description: "Event-like polished style for visiting specialist and campaigns",
    theme: {
      badge_style: "outline",
      layout_density: "comfortable",
      accent_color: "#7c3aed",
      background_color: "#faf5ff",
      text_color: "#3b0764",
    },
  },
  {
    key: "success_offer",
    label: "Success Offer",
    description: "Offer-focused with positive conversion cues",
    theme: {
      badge_style: "solid",
      layout_density: "comfortable",
      accent_color: "#16a34a",
      background_color: "#f0fdf4",
      text_color: "#14532d",
    },
  },
  {
    key: "emerald_brand",
    label: "Emerald Brand",
    description: "Signature green aligned with Emerald Medical Centre",
    theme: {
      badge_style: "soft",
      layout_density: "comfortable",
      accent_color: "#10b981",
      background_color: "#ecfdf5",
      text_color: "#064e3b",
    },
  },
  {
    key: "ocean_calm",
    label: "Ocean Calm",
    description: "Cool teal tones for reassuring, clinical messaging",
    theme: {
      badge_style: "outline",
      layout_density: "comfortable",
      accent_color: "#0d9488",
      background_color: "#f0fdfa",
      text_color: "#134e4a",
    },
  },
  {
    key: "warm_amber",
    label: "Warm Amber",
    description: "Friendly promotional warmth for camps and limited offers",
    theme: {
      badge_style: "solid",
      layout_density: "comfortable",
      accent_color: "#d97706",
      background_color: "#fffbeb",
      text_color: "#78350f",
    },
  },
  {
    key: "navy_professional",
    label: "Navy Professional",
    description: "Deep navy for authoritative, hospital-grade trust",
    theme: {
      badge_style: "outline",
      layout_density: "comfortable",
      accent_color: "#1e3a8a",
      background_color: "#eff6ff",
      text_color: "#1e293b",
    },
  },
  {
    key: "rose_womens_health",
    label: "Rose Care",
    description: "Soft rose palette for fertility and women's health",
    theme: {
      badge_style: "soft",
      layout_density: "comfortable",
      accent_color: "#db2777",
      background_color: "#fdf2f8",
      text_color: "#831843",
    },
  },
  {
    key: "indigo_trust",
    label: "Indigo Trust",
    description: "Balanced indigo for specialist visits and credibility",
    theme: {
      badge_style: "soft",
      layout_density: "comfortable",
      accent_color: "#4f46e5",
      background_color: "#eef2ff",
      text_color: "#312e81",
    },
  },
  {
    key: "slate_modern",
    label: "Slate Modern",
    description: "Neutral slate for minimal, modern announcements",
    theme: {
      badge_style: "outline",
      layout_density: "compact",
      accent_color: "#475569",
      background_color: "#f8fafc",
      text_color: "#0f172a",
    },
  },
  {
    key: "sunset_coral",
    label: "Sunset Coral",
    description: "Vibrant coral for high-energy campaigns and events",
    theme: {
      badge_style: "solid",
      layout_density: "comfortable",
      accent_color: "#ea580c",
      background_color: "#fff7ed",
      text_color: "#7c2d12",
    },
  },
  {
    key: "midnight_focus",
    label: "Midnight Focus",
    description: "Dark accent on light ground for bold contrast",
    theme: {
      badge_style: "solid",
      layout_density: "compact",
      accent_color: "#0f172a",
      background_color: "#f1f5f9",
      text_color: "#020617",
    },
  },
  {
    key: "lavender_gentle",
    label: "Lavender Gentle",
    description: "Soft lavender for calm, supportive patient communication",
    theme: {
      badge_style: "soft",
      layout_density: "comfortable",
      accent_color: "#7c3aed",
      background_color: "#f5f3ff",
      text_color: "#4c1d95",
    },
  },
] as const;

interface FormState {
  type: string;
  title: string;
  body: string;
  image_url: string;
  icon: string;
  placements: Placement[];
  presentation: Record<string, {
    variant?: string;
    layout?: string;
    size?: string;
    trigger?: { type: TriggerType; value?: number };
    pages?: string[];
  }>;
  severity: string;
  priority: number;
  exclusive: boolean;
  frequency: { strategy: string; cooldown_hours?: number; max_impressions?: number };
  trigger: { type: TriggerType; value?: number };
  page_rules: { include?: string[]; exclude?: string[] };
  devices: string[];
  audience: string[];
  start_at: string;
  end_at: string;
  time_window_enabled: boolean;
  time_window: { start_time: string; end_time: string; timezone: string; days_of_week?: number[] };
  theme: {
    accent_color?: string;
    background_color?: string;
    text_color?: string;
    badge_style?: string;
    layout_density?: string;
    dark_mode_overrides?: { accent_color?: string; background_color?: string; text_color?: string };
  };
  primary_cta_label: string;
  primary_cta_url: string;
  secondary_cta_label: string;
  secondary_cta_url: string;
  metadataJson: string;
  dismissible: boolean;
  is_active: boolean;
}

const DEFAULT_TIME_WINDOW = {
  start_time: "09:00",
  end_time: "18:00",
  timezone: "Asia/Kolkata",
  days_of_week: [] as number[],
};

const emptyForm = (): FormState => ({
  type: "general",
  title: "",
  body: "",
  image_url: "",
  icon: "",
  placements: ["top_bar"],
  presentation: { top_bar: { variant: "slim_strip" } },
  severity: "info",
  priority: 0,
  exclusive: false,
  frequency: { strategy: "always" },
  trigger: { type: "on_load" },
  page_rules: {},
  devices: [...DEVICES],
  audience: ["all"],
  start_at: "",
  end_at: "",
  time_window_enabled: false,
  time_window: { ...DEFAULT_TIME_WINDOW },
  theme: {},
  primary_cta_label: "",
  primary_cta_url: "",
  secondary_cta_label: "",
  secondary_cta_url: "",
  metadataJson: "{}",
  dismissible: true,
  is_active: true,
});

function fromAnnouncement(a: Announcement): FormState {
  return {
    type: a.type,
    title: a.title ?? "",
    body: a.body ?? "",
    image_url: a.image_url ?? "",
    icon: a.icon ?? "",
    placements: (a.placements ?? []) as Placement[],
    presentation: (a.presentation ?? {}) as FormState["presentation"],
    severity: a.severity,
    priority: a.priority ?? 0,
    exclusive: a.exclusive ?? false,
    frequency: a.frequency,
    trigger: a.trigger,
    page_rules: a.page_rules ?? {},
    devices: a.devices ?? [...DEVICES],
    audience: a.audience ?? ["all"],
    start_at: a.start_at ? a.start_at.slice(0, 16) : "",
    end_at: a.end_at ? a.end_at.slice(0, 16) : "",
    time_window_enabled: Boolean(a.time_window),
    time_window: {
      start_time: a.time_window?.start_time ?? DEFAULT_TIME_WINDOW.start_time,
      end_time: a.time_window?.end_time ?? DEFAULT_TIME_WINDOW.end_time,
      timezone: a.time_window?.timezone ?? DEFAULT_TIME_WINDOW.timezone,
      days_of_week: a.time_window?.days_of_week ?? [],
    },
    theme: a.theme ?? {},
    primary_cta_label: a.primary_cta_label ?? "",
    primary_cta_url: a.primary_cta_url ?? "",
    secondary_cta_label: a.secondary_cta_label ?? "",
    secondary_cta_url: a.secondary_cta_url ?? "",
    metadataJson: JSON.stringify(a.metadata ?? {}, null, 2),
    dismissible: a.dismissible ?? true,
    is_active: a.is_active ?? true,
  };
}

const THEME_COLOR_RE =
  /^(#([0-9a-f]{3}|[0-9a-f]{6})|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)|hsl\(.*\))$/i;

function isValidThemeColor(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  return THEME_COLOR_RE.test(value.trim());
}

function parseScheduleIso(value: string, label: string): string | { error: string } {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { error: `${label} is not a valid date and time.` };
  return d.toISOString();
}

function toCandidatePayload(f: FormState): AnnouncementWrite | { error: string } {
  let metadata: Record<string, unknown> = {};
  try {
    metadata = f.metadataJson.trim() ? JSON.parse(f.metadataJson) : {};
  } catch {
    return { error: "Metadata is not valid JSON" };
  }

  let start_at: string | null = null;
  if (f.start_at) {
    const parsed = parseScheduleIso(f.start_at, "Start date");
    if (typeof parsed === "object" && "error" in parsed) return parsed;
    start_at = parsed;
  }
  let end_at: string | null = null;
  if (f.end_at) {
    const parsed = parseScheduleIso(f.end_at, "End date");
    if (typeof parsed === "object" && "error" in parsed) return parsed;
    end_at = parsed;
  }

  return {
    type: f.type.trim(),
    title: f.title.trim(),
    body: f.body,
    image_url: f.image_url || null,
    icon: f.icon || null,
    placements: f.placements,
    presentation: f.presentation,
    severity: f.severity as AnnouncementWrite["severity"],
    priority: f.priority,
    exclusive: f.exclusive,
    frequency: f.frequency,
    trigger: f.trigger,
    page_rules: f.page_rules,
    devices: f.devices as AnnouncementWrite["devices"],
    audience: f.audience as AnnouncementWrite["audience"],
    start_at,
    end_at,
    time_window: f.time_window_enabled ? f.time_window : null,
    theme: f.theme,
    primary_cta_label: f.primary_cta_label || null,
    primary_cta_url: f.primary_cta_url || null,
    secondary_cta_label: f.secondary_cta_label || null,
    secondary_cta_url: f.secondary_cta_url || null,
    metadata,
    dismissible: f.dismissible,
    is_active: f.is_active,
  };
}

function parseMetadataSafe(raw: string): Record<string, unknown> {
  try {
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const DAY_LABELS: Array<{ value: number; label: string }> = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const TRIGGER_VALUE_TYPES: TriggerType[] = ["delay", "scroll_percent", "idle"];
const DEFAULT_POPULAR_TYPE_KEYS = ["general", "discount", "visiting_doctor", "camp", "service_alert"];
const STEP_TABS = ["basics", "content", "ctas", "placement", "schedule", "frequency", "targeting", "advanced", "theme"] as const;
const DRAFT_KEY = "emc_announcement_draft_v1";
type StepTab = (typeof STEP_TABS)[number];

interface DraftPayload {
  form: FormState;
  tab: string;
  imageInputMode: "upload" | "url";
  savedAt: string;
}

function InfoDot({ text }: { text: string }) {
  return (
    <span className="text-[11px] text-muted-foreground">{text}</span>
  );
}

function readDraft(): DraftPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftPayload;
  } catch {
    return null;
  }
}

function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // noop
  }
}

function isSafeLink(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  const lower = v.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) return false;
  return (
    v.startsWith("/") ||
    v.startsWith("#") ||
    lower.startsWith("https://") ||
    lower.startsWith("http://") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:")
  );
}

type StatusFilter = "all" | AnnouncementLifecycleStatus;

const STATUS_FILTERS: StatusFilter[] = ["all", ...LIFECYCLE_STATUSES];

const STATUS_BADGE_VARIANT: Record<
  AnnouncementLifecycleStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  scheduled: "outline",
  live: "default",
  paused: "secondary",
  expired: "destructive",
  archived: "secondary",
};

const AdminAnnouncements = () => {
  const { profile } = useAuth();
  const { canAccess } = useFeaturePermissions();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  // Always fetch the full set so the filter chips can show counts. The chip
  // logic filters in-memory; using server-side `?status=` would force a refetch
  // on every chip click and lose row-count chips.
  const list = useAdminAnnouncements();
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();
  const remove = useDeleteAnnouncement();
  const clone = useCloneAnnouncement();
  const pause = usePauseAnnouncement();
  const publish = usePublishAnnouncement();
  const restore = useRestoreAnnouncement();
  const bulk = useBulkAnnouncementAction();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");
  const [saving, setSaving] = useState(false);
  const [publishOnSave, setPublishOnSave] = useState(false);
  const [tab, setTab] = useState("basics");
  const [stepErrors, setStepErrors] = useState<Partial<Record<StepTab, string[]>>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const hasAccess = canAccess("announcements", profile?.role);

  const items = useMemo(() => (list.data ?? []) as Announcement[], [list.data]);

  const typeUsageCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const a of items) out[a.type] = (out[a.type] ?? 0) + 1;
    return out;
  }, [items]);

  const typeOptions = useMemo<TypeOption[]>(
    () =>
      Object.entries(ANNOUNCEMENT_TYPES)
        .map(([key, preset]) => ({
          key,
          label: preset.label,
          description: preset.description,
          count: typeUsageCounts[key] ?? 0,
          searchLabel: `${key} ${preset.label} ${preset.description}`.toLowerCase(),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [typeUsageCounts],
  );

  const popularTypeKeys = useMemo(() => {
    const used = [...typeOptions]
      .filter((o) => o.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((o) => o.key);
    if (used.length > 0) return used;
    return DEFAULT_POPULAR_TYPE_KEYS.filter((k) => Boolean(ANNOUNCEMENT_TYPES[k]));
  }, [typeOptions]);

  const popularTypeSet = useMemo(() => new Set(popularTypeKeys), [popularTypeKeys]);

  const popularTypeOptions = useMemo(
    () => typeOptions.filter((o) => popularTypeSet.has(o.key)),
    [typeOptions, popularTypeSet],
  );

  const otherTypeOptions = useMemo(
    () => typeOptions.filter((o) => !popularTypeSet.has(o.key)),
    [typeOptions, popularTypeSet],
  );

  const selectedType = useMemo(
    () => typeOptions.find((o) => o.key === form.type) ?? null,
    [typeOptions, form.type],
  );

  const generatedPayloadText = useMemo(() => {
    const candidate = toCandidatePayload(form);
    if ("error" in candidate) return `Invalid payload: ${candidate.error}`;
    return JSON.stringify(candidate, null, 2);
  }, [form]);

  const currentStepIndex = useMemo(
    () => Math.max(0, STEP_TABS.indexOf(tab as StepTab)),
    [tab],
  );
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEP_TABS.length - 1;

  const metadataFields = METADATA_FIELDS[form.type] ?? [];
  const metadataObject = useMemo(() => parseMetadataSafe(form.metadataJson), [form.metadataJson]);
  const savedDraft = readDraft();
  const previewTheme = useMemo((): PreviewTheme => {
    const typePreset = getTypePreset(form.type);
    return {
      accent: form.theme.accent_color || typePreset.accent,
      background: form.theme.background_color || "#ffffff",
      text: form.theme.text_color || "#111827",
      badgeStyle: form.theme.badge_style || "soft",
      density: (form.theme.layout_density === "compact" ? "compact" : "comfortable"),
    };
  }, [form.type, form.theme]);

  const stepValidationMessages = useCallback((step: StepTab): string[] => {
    const errs: string[] = [];
    switch (step) {
      case "basics": {
        if (!form.type.trim()) errs.push("Select an announcement type.");
        if (!form.title.trim()) errs.push("Title is required.");
        if (form.title.trim().length > 200) errs.push("Title must be 200 characters or less.");
        break;
      }
      case "content": {
        if ((form.body ?? "").length > 5000) errs.push("Body must be 5000 characters or less.");
        if (form.image_url && !isSafeLink(form.image_url)) errs.push("Image URL must be relative (/...) or an allowed URL scheme.");
        break;
      }
      case "ctas": {
        if (form.primary_cta_label && !form.primary_cta_url) errs.push("Primary CTA URL is required when primary CTA label is set.");
        if (form.primary_cta_url && !form.primary_cta_label) errs.push("Primary CTA label is required when primary CTA URL is set.");
        if (form.secondary_cta_label && !form.secondary_cta_url) errs.push("Secondary CTA URL is required when secondary CTA label is set.");
        if (form.secondary_cta_url && !form.secondary_cta_label) errs.push("Secondary CTA label is required when secondary CTA URL is set.");
        if (form.primary_cta_url && !isSafeLink(form.primary_cta_url)) errs.push("Primary CTA URL is invalid.");
        if (form.secondary_cta_url && !isSafeLink(form.secondary_cta_url)) errs.push("Secondary CTA URL is invalid.");
        break;
      }
      case "placement": {
        if (form.placements.length === 0) errs.push("Choose at least one placement.");
        for (const p of form.placements) {
          const variant = form.presentation[p]?.variant;
          if (variant && !PLACEMENT_VARIANTS[p].includes(variant)) {
            errs.push(`Invalid variant '${variant}' for '${p}'.`);
          }
          const overrideType = form.presentation[p]?.trigger?.type;
          const overrideValue = form.presentation[p]?.trigger?.value;
          if (overrideType === "scroll_percent" && (overrideValue == null || overrideValue < 5 || overrideValue > 95)) {
            errs.push(`Placement '${p}' scroll percent must be between 5 and 95.`);
          }
          if (overrideType === "delay" && (overrideValue == null || overrideValue < 0)) {
            errs.push(`Placement '${p}' delay must be 0 or more.`);
          }
          if (overrideType === "idle" && (overrideValue == null || overrideValue < 1)) {
            errs.push(`Placement '${p}' idle seconds must be 1 or more.`);
          }
        }
        break;
      }
      case "schedule": {
        if (form.start_at && Number.isNaN(new Date(form.start_at).getTime())) {
          errs.push("Start date is not valid.");
        }
        if (form.end_at && Number.isNaN(new Date(form.end_at).getTime())) {
          errs.push("End date is not valid.");
        }
        if (form.start_at && form.end_at && new Date(form.start_at) >= new Date(form.end_at)) {
          errs.push("Start time must be before end time.");
        }
        if (form.time_window_enabled) {
          if (!form.time_window.start_time || !form.time_window.end_time) errs.push("Time window requires both start and end time.");
          if (!form.time_window.timezone.trim()) errs.push("Time window timezone is required.");
          if (form.time_window.start_time >= form.time_window.end_time) errs.push("Time window start must be before end.");
        }
        break;
      }
      case "frequency": {
        if (form.frequency.strategy === "cooldown" && (!form.frequency.cooldown_hours || form.frequency.cooldown_hours < 1)) {
          errs.push("Cooldown hours must be at least 1.");
        }
        if (form.frequency.strategy === "max_impressions" && (!form.frequency.max_impressions || form.frequency.max_impressions < 1)) {
          errs.push("Max impressions must be at least 1.");
        }
        if (form.trigger.type === "delay" && (form.trigger.value == null || form.trigger.value < 0)) {
          errs.push("Global delay trigger requires a value of 0 or more.");
        }
        if (form.trigger.type === "scroll_percent" && (form.trigger.value == null || form.trigger.value < 5 || form.trigger.value > 95)) {
          errs.push("Global scroll percent trigger requires a value between 5 and 95.");
        }
        if (form.trigger.type === "idle" && (form.trigger.value == null || form.trigger.value < 1)) {
          errs.push("Global idle trigger requires a value of 1 or more.");
        }
        break;
      }
      case "targeting": {
        if (form.devices.length === 0) errs.push("Select at least one device.");
        if (form.audience.length === 0) errs.push("Select at least one audience segment.");
        break;
      }
      case "advanced": {
        try {
          JSON.parse(form.metadataJson.trim() || "{}");
        } catch {
          errs.push("Metadata JSON is invalid.");
        }
        break;
      }
      case "theme": {
        const colors = [
          form.theme.accent_color,
          form.theme.background_color,
          form.theme.text_color,
          form.theme.dark_mode_overrides?.accent_color,
          form.theme.dark_mode_overrides?.background_color,
          form.theme.dark_mode_overrides?.text_color,
        ];
        for (const c of colors) {
          if (!isValidThemeColor(c)) {
            errs.push("Theme colors must be hex (#RGB or #RRGGBB), rgb(), rgba(), or hsl().");
            break;
          }
        }
        break;
      }
      default:
        break;
    }
    return errs;
  }, [form]);

  const validateStep = useCallback((step: StepTab, withToast = true): boolean => {
    const errs = stepValidationMessages(step);
    setStepErrors((prev) => ({ ...prev, [step]: errs }));
    if (errs.length > 0 && withToast) {
      toast({ title: `Fix ${step} step`, description: errs[0], variant: "destructive" });
    }
    return errs.length === 0;
  }, [stepValidationMessages, toast]);

  const validateAllSteps = useCallback((): StepTab | null => {
    const nextErrors: Partial<Record<StepTab, string[]>> = {};
    for (const s of STEP_TABS) {
      const errs = stepValidationMessages(s);
      if (errs.length > 0) nextErrors[s] = errs;
    }
    setStepErrors(nextErrors);
    return STEP_TABS.find((s) => (nextErrors[s]?.length ?? 0) > 0) ?? null;
  }, [stepValidationMessages]);

  const setMetadataField = (key: string, type: MetadataFieldType, value: string | boolean) => {
    const next = { ...metadataObject } as Record<string, unknown>;
    if (type === "boolean") {
      next[key] = Boolean(value);
    } else if (type === "number") {
      const n = Number(value);
      if (Number.isFinite(n)) next[key] = n;
      else delete next[key];
    } else if (type === "string_array") {
      const list = String(value).split(",").map((s) => s.trim()).filter(Boolean);
      next[key] = list;
    } else {
      const text = String(value);
      if (text.trim().length === 0) delete next[key];
      else next[key] = text;
    }
    setForm((f) => ({ ...f, metadataJson: JSON.stringify(next, null, 2) }));
  };

  const openNew = () => {
    setEditing(null);
    const draft = readDraft();
    if (draft?.form) {
      setForm(draft.form);
      setImageInputMode(draft.imageInputMode ?? "upload");
      setTab((draft.tab && STEP_TABS.includes(draft.tab as (typeof STEP_TABS)[number])) ? draft.tab : "basics");
      toast({ title: "Draft restored", description: "Loaded your last saved announcement draft." });
    } else {
      setForm(emptyForm());
      setImageInputMode("upload");
      setTab("basics");
    }
    setOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm(fromAnnouncement(a));
    setImageInputMode("url");
    setTab("basics");
    setOpen(true);
  };

  const saveDraftSnapshot = useCallback((nextTab?: string) => {
    if (typeof window === "undefined" || editing) return;
    const payload: DraftPayload = {
      form,
      imageInputMode,
      tab: nextTab ?? tab,
      savedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {
      // noop
    }
  }, [editing, form, imageInputMode, tab]);

  const goNextStep = () => {
    if (isLastStep) return;
    if (!validateStep(tab as StepTab)) return;
    const next = STEP_TABS[Math.min(currentStepIndex + 1, STEP_TABS.length - 1)];
    saveDraftSnapshot(next);
    setTab(next);
  };

  const goPrevStep = () => {
    if (isFirstStep) return;
    const prev = STEP_TABS[Math.max(currentStepIndex - 1, 0)];
    saveDraftSnapshot(prev);
    setTab(prev);
  };

  const handleTabChange = (nextTab: string) => {
    if (!STEP_TABS.includes(nextTab as StepTab)) return;
    const nextIndex = STEP_TABS.indexOf(nextTab as StepTab);
    if (nextIndex > currentStepIndex && !validateStep(tab as StepTab)) return;
    setTab(nextTab);
    saveDraftSnapshot(nextTab);
  };

  useEffect(() => {
    if (!open || editing) return;
    const t = window.setTimeout(() => saveDraftSnapshot(), 250);
    return () => window.clearTimeout(t);
  }, [open, editing, saveDraftSnapshot]);

  const applyTypePreset = (typeKey: string) => {
    const preset = getTypePreset(typeKey);
    setForm((f) => ({
      ...f,
      type: typeKey,
      icon: f.icon || preset.icon,
      severity: preset.defaultSeverity,
      placements: f.placements.length === 0 ? preset.defaultPlacements : f.placements,
      frequency: { ...f.frequency, strategy: preset.defaultFrequency },
      trigger: { type: preset.defaultTrigger, value: f.trigger.value },
      exclusive: preset.defaultExclusive,
    }));
  };

  const togglePlacement = (p: Placement) => {
    setForm((f) => {
      const has = f.placements.includes(p);
      const next = has ? f.placements.filter((x) => x !== p) : [...f.placements, p];
      const presentation = { ...f.presentation };
      if (!has && !presentation[p]) {
        presentation[p] = { variant: PLACEMENT_VARIANTS[p][0] };
      }
      if (has) delete presentation[p];
      return { ...f, placements: next, presentation };
    });
  };

  const setVariant = (p: Placement, variant: string) => {
    setForm((f) => ({ ...f, presentation: { ...f.presentation, [p]: { ...f.presentation[p], variant } } }));
  };

  const setPlacementTriggerType = (p: Placement, value: string) => {
    setForm((f) => {
      const current = f.presentation[p] ?? {};
      if (value === "__inherit__") {
        const { trigger, ...rest } = current;
        return { ...f, presentation: { ...f.presentation, [p]: rest } };
      }
      return {
        ...f,
        presentation: {
          ...f.presentation,
          [p]: {
            ...current,
            trigger: { type: value as TriggerType, value: current.trigger?.value },
          },
        },
      };
    });
  };

  const setPlacementTriggerValue = (p: Placement, value: number) => {
    setForm((f) => ({
      ...f,
      presentation: {
        ...f.presentation,
        [p]: {
          ...(f.presentation[p] ?? {}),
          trigger: {
            type: (f.presentation[p]?.trigger?.type ?? "on_load") as TriggerType,
            value,
          },
        },
      },
    }));
  };

  const togglePlacementPage = (p: Placement, path: string) => {
    setForm((f) => {
      const current = f.presentation[p]?.pages ?? [];
      const next = current.includes(path)
        ? current.filter((x) => x !== path)
        : [...current, path];
      return {
        ...f,
        presentation: {
          ...f.presentation,
          [p]: { ...f.presentation[p], pages: next },
        },
      };
    });
  };

  // shouldPublish=true means: after create/update, also call /publish so the row
  // ends up Live (or Scheduled, if start_at is in the future). Default is to
  // save as Draft (is_active=false, published_at=null) so admins can review first.
  const save = async (shouldPublish = false) => {
    const firstInvalidStep = validateAllSteps();
    if (firstInvalidStep) {
      setTab(firstInvalidStep);
      const firstError = stepValidationMessages(firstInvalidStep)[0] ?? "Fix highlighted fields before saving.";
      toast({ title: `Fix ${firstInvalidStep} step`, description: firstError, variant: "destructive" });
      return;
    }

    const candidate = toCandidatePayload(form);
    if ("error" in candidate) {
      toast({ title: candidate.error, variant: "destructive" });
      return;
    }

    const parsed = announcementWriteSchema.safeParse(candidate);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      const field = first?.path?.length ? first.path.join(".") : "form";
      toast({
        title: "Invalid announcement",
        description: first ? `${field}: ${first.message}` : "Check required fields and try again.",
        variant: "destructive",
      });
      return;
    }

    const cross = validateAnnouncementCrossFields(parsed.data);
    if (cross) {
      toast({ title: cross, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        // For an existing row we honor the form's is_active flag as before.
        await update.mutateAsync({ id: editing.id, body: parsed.data });
        if (shouldPublish) {
          await publish.mutateAsync(editing.id);
          toast({ title: "Published" });
        } else {
          toast({ title: "Announcement updated" });
        }
      } else {
        // New rows always start as Draft (is_active=false). If the admin chose
        // "Publish now", flip them via the explicit /publish endpoint so the
        // server stamps published_at consistently.
        const draftPayload = { ...parsed.data, is_active: false };
        const created = (await create.mutateAsync(draftPayload)) as Announcement;
        clearDraft();
        if (shouldPublish && created?.id) {
          await publish.mutateAsync(created.id);
          toast({ title: "Published" });
        } else {
          toast({ title: "Draft saved", description: "Use Publish to make it live." });
        }
      }
      setOpen(false);
    } catch (err: unknown) {
      const description = announcementSaveMessage(err);
      const title = shouldPublish ? "Publish failed" : "Save failed";
      toast({ title, description, variant: "destructive" });
    } finally {
      setSaving(false);
      setPublishOnSave(false);
    }
  };

  const handleArchive = async (a: Announcement) => {
    const result = await confirm({
      title: "Archive announcement?",
      description: `"${a.title}" will be hidden from all placements. You can restore it from the Archived tab.`,
      confirmLabel: "Archive",
      variant: "destructive",
    });
    if (!result.confirmed) return;
    try {
      await remove.mutateAsync(a.id);
      toast({ title: "Archived" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Archive failed", description: msg, variant: "destructive" });
    }
  };

  const handlePause = async (a: Announcement) => {
    try {
      await pause.mutateAsync(a.id);
      toast({ title: "Paused" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Pause failed", description: msg, variant: "destructive" });
    }
  };

  const handlePublish = async (a: Announcement) => {
    try {
      await publish.mutateAsync(a.id);
      toast({ title: getLifecycleStatus(a) === "draft" ? "Published" : "Resumed" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Publish failed", description: msg, variant: "destructive" });
    }
  };

  const handleRestore = async (a: Announcement) => {
    try {
      await restore.mutateAsync(a.id);
      toast({ title: "Restored to Draft", description: "Configure dates and Publish to make it live again." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Restore failed", description: msg, variant: "destructive" });
    }
  };

  const handleClone = async (a: Announcement) => {
    try {
      const cloned = (await clone.mutateAsync(a.id)) as Announcement;
      toast({ title: "Cloned", description: `Created "${cloned.title}" as a draft.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Clone failed", description: msg, variant: "destructive" });
    }
  };

  // Republish for expired rows: clones then opens the form pre-filled with the
  // copy so the admin can adjust dates and Publish in one go.
  const handleRepublish = async (a: Announcement) => {
    try {
      const cloned = (await clone.mutateAsync(a.id)) as Announcement;
      setEditing(cloned);
      setForm({ ...fromAnnouncement(cloned), title: cloned.title.replace(/^Copy of /, "") });
      setImageInputMode("url");
      setTab("schedule");
      setOpen(true);
      toast({ title: "Republishing", description: "Adjust the schedule and click Publish now." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Republish failed", description: msg, variant: "destructive" });
    }
  };

  const handleBulk = async (action: AnnouncementBulkAction) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const verb = action === "archive" ? "archive" : action;
    if (action === "archive") {
      const result = await confirm({
        title: `Archive ${ids.length} announcements?`,
        description: "Archived rows can be restored from the Archived tab.",
        confirmLabel: "Archive",
        variant: "destructive",
      });
      if (!result.confirmed) return;
    }
    try {
      await bulk.mutateAsync({ ids, action });
      toast({ title: `Bulk ${verb} complete`, description: `${ids.length} announcements affected.` });
      setSelectedIds(new Set());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: `Bulk ${verb} failed`, description: msg, variant: "destructive" });
    }
  };

  const filteredItems = useMemo(() => {
    if (statusFilter === "all") {
      return items.filter((a) => getLifecycleStatus(a) !== "archived");
    }
    return items.filter((a) => getLifecycleStatus(a) === statusFilter);
  }, [items, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: 0, draft: 0, scheduled: 0, live: 0, paused: 0, expired: 0, archived: 0,
    };
    for (const a of items) {
      const s = getLifecycleStatus(a);
      counts[s] += 1;
      if (s !== "archived") counts.all += 1;
    }
    return counts;
  }, [items]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((a) => selectedIds.has(a.id));
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        for (const a of filteredItems) next.delete(a.id);
        return next;
      }
      const next = new Set(prev);
      for (const a of filteredItems) next.add(a.id);
      return next;
    });
  };

  // Clear selection when changing tabs to avoid acting on hidden rows.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusFilter]);

  if (!hasAccess) return <Navigate to="/admin" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Announcements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customizable announcements: top bars, popups, home sections, corner toasts, and inline.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> New Announcement
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((status) => {
          const count = statusCounts[status];
          const active = statusFilter === status;
          const label = status === "all" ? "All" : LIFECYCLE_STATUS_LABELS[status];
          return (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
            >
              {label}
              <Badge
                variant={active ? "secondary" : "outline"}
                className="ml-2 px-1.5 py-0 text-[10px]"
              >
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-2">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="outline" onClick={() => handleBulk("publish")} disabled={bulk.isPending}>
              <Play className="mr-1.5 h-3.5 w-3.5" /> Publish
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulk("pause")} disabled={bulk.isPending}>
              <Pause className="mr-1.5 h-3.5 w-3.5" /> Pause
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulk("restore")} disabled={bulk.isPending}>
              <ArchiveRestore className="mr-1.5 h-3.5 w-3.5" /> Restore
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulk("archive")} disabled={bulk.isPending}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5 text-destructive" /> Archive
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr className="text-left">
              <th className="w-10 p-3">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Placements</th>
              <th className="p-3 font-medium">Severity</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
            )}
            {!list.isLoading && savedDraft?.form && (statusFilter === "all" || statusFilter === "draft") && (
              <tr className="border-b bg-amber-50/50">
                <td className="p-3" />
                <td className="p-3">
                  <div className="font-medium">{savedDraft.form.title || "Untitled draft"}</div>
                  <div className="text-xs text-muted-foreground">Local draft saved at {new Date(savedDraft.savedAt).toLocaleString()}</div>
                </td>
                <td className="p-3">{getTypePreset(savedDraft.form.type || "general").label}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {(savedDraft.form.placements ?? []).map((p) => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}
                  </div>
                </td>
                <td className="p-3 capitalize">{savedDraft.form.severity || "info"}</td>
                <td className="p-3"><Badge variant="secondary">Draft (local)</Badge></td>
                <td className="p-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button size="sm" variant="ghost" onClick={openNew}>Continue</Button>
                    <Button size="sm" variant="ghost" onClick={() => { clearDraft(); toast({ title: "Draft cleared" }); }}>Discard</Button>
                  </div>
                </td>
              </tr>
            )}
            {!list.isLoading && filteredItems.length === 0 && !(savedDraft?.form && (statusFilter === "all" || statusFilter === "draft")) && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">
                {statusFilter === "all"
                  ? "No announcements yet. Create your first one."
                  : `No announcements in "${LIFECYCLE_STATUS_LABELS[statusFilter as AnnouncementLifecycleStatus] ?? statusFilter}".`}
              </td></tr>
            )}
            {filteredItems.map((a) => {
              const status = getLifecycleStatus(a);
              const checked = selectedIds.has(a.id);
              return (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-3">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleSelect(a.id)}
                      aria-label={`Select ${a.title}`}
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{a.title}</div>
                    {a.body && <div className="text-xs text-muted-foreground line-clamp-1">{a.body.replace(/<[^>]*>/g, "")}</div>}
                  </td>
                  <td className="p-3">{getTypePreset(a.type).label}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {a.placements.map((p) => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}
                    </div>
                  </td>
                  <td className="p-3 capitalize">{a.severity}</td>
                  <td className="p-3">
                    <Badge variant={STATUS_BADGE_VARIANT[status]}>{LIFECYCLE_STATUS_LABELS[status]}</Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      {(status === "draft" || status === "paused") && (
                        <Button size="sm" variant="ghost" onClick={() => handlePublish(a)} title={status === "draft" ? "Publish" : "Resume"}>
                          <Play className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {(status === "live" || status === "scheduled") && (
                        <Button size="sm" variant="ghost" onClick={() => handlePause(a)} title="Pause">
                          <Pause className="h-4 w-4 text-amber-600" />
                        </Button>
                      )}
                      {status === "expired" && (
                        <Button size="sm" variant="ghost" onClick={() => handleRepublish(a)} title="Republish (clones with cleared dates)">
                          <RefreshCw className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      {status === "archived" && (
                        <Button size="sm" variant="ghost" onClick={() => handleRestore(a)} title="Restore to Draft">
                          <ArchiveRestore className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      {status !== "archived" && (
                        <Button size="sm" variant="ghost" onClick={() => openEdit(a)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleClone(a)} title="Clone" disabled={clone.isPending}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      {status !== "archived" && (
                        <Button size="sm" variant="ghost" onClick={() => handleArchive(a)} title="Archive">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[92svh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Announcement" : "New Announcement"}</DialogTitle>
          </DialogHeader>

          <Tabs value={tab} onValueChange={handleTabChange} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-5 lg:grid-cols-9">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="ctas">CTAs</TabsTrigger>
              <TabsTrigger value="placement">Placement</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="frequency">Frequency</TabsTrigger>
              <TabsTrigger value="targeting">Targeting</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="theme">Look</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-1 mt-4 space-y-4">
              {(stepErrors[tab as StepTab]?.length ?? 0) > 0 && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive space-y-1">
                  <div className="font-medium">Please fix these before continuing:</div>
                  {stepErrors[tab as StepTab]?.map((err) => (
                    <div key={err}>- {err}</div>
                  ))}
                </div>
              )}
              <TabsContent value="basics" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5"><Label>Type</Label><InfoDot text="Template type controls default behavior, icon, and structured metadata fields." /></div>
                  <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={typeOpen} className="w-full justify-between font-normal">
                        {selectedType ? `${selectedType.label} - ${selectedType.description}` : "Select announcement type"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 overflow-hidden" align="start">
                      <Command filter={(value, search) => {
                        const opt = typeOptions.find((o) => o.key === value);
                        if (!opt) return 0;
                        return opt.searchLabel.includes(search.toLowerCase()) ? 1 : 0;
                      }}>
                        <CommandInput placeholder="Search announcement types..." />
                        <CommandList
                          className="h-[340px] overflow-y-auto overscroll-contain"
                          onWheelCapture={(e) => e.stopPropagation()}
                        >
                          <CommandEmpty>No type found.</CommandEmpty>

                          {popularTypeOptions.length > 0 && (
                            <CommandGroup heading="Most used">
                              {popularTypeOptions.map((o) => (
                                <CommandItem
                                  key={o.key}
                                  value={o.key}
                                  onSelect={(v) => {
                                    applyTypePreset(v);
                                    setTypeOpen(false);
                                  }}
                                >
                                  <Check className={"mr-2 h-4 w-4 " + (form.type === o.key ? "opacity-100" : "opacity-0")} />
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium">{o.label}</div>
                                    <div className="truncate text-xs text-muted-foreground">{o.description}</div>
                                  </div>
                                  <Badge className="ml-2 border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                    Most used
                                  </Badge>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}

                          <CommandGroup heading="Other types">
                            {otherTypeOptions.map((o) => {
                              const leastUsed = o.count === 0;
                              return (
                                <CommandItem
                                  key={o.key}
                                  value={o.key}
                                  onSelect={(v) => {
                                    applyTypePreset(v);
                                    setTypeOpen(false);
                                  }}
                                >
                                  <Check className={"mr-2 h-4 w-4 " + (form.type === o.key ? "opacity-100" : "opacity-0")} />
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium">{o.label}</div>
                                    <div className="truncate text-xs text-muted-foreground">{o.description}</div>
                                  </div>
                                  {leastUsed ? (
                                    <Badge className="ml-2 border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">
                                      Least used
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="ml-2">
                                      Used {o.count}
                                    </Badge>
                                  )}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5"><Label>Title <span className="text-destructive">*</span></Label><InfoDot text="Primary announcement heading shown in placements." /></div>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5"><Label>Severity</Label><InfoDot text="Affects ordering and urgency styling. critical > warning > notice > info." /></div>
                  <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5"><Label>Priority (higher shows first)</Label><InfoDot text="Manual tie-breaker after severity. Larger number appears first." /></div>
                    <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value, 10) || 0 })} />
                  </div>
                  <div className="flex items-center gap-2 pt-7">
                    <Switch checked={form.exclusive} onCheckedChange={(c) => setForm({ ...form, exclusive: c })} />
                    <Label>Exclusive (preempts others in same placement)</Label>
                    <InfoDot text="If enabled, this announcement can suppress others in the same placement." />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
                  <Label>Active</Label>
                  <InfoDot text="Inactive announcements are saved but never shown publicly." />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.dismissible} onCheckedChange={(c) => setForm({ ...form, dismissible: c })} />
                  <Label>Dismissible</Label>
                  <InfoDot text="Allows users to close this announcement on the frontend." />
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5"><Label>Icon</Label><InfoDot text="Lucide icon name used as a visual marker in announcements." /></div>
                  <div className="flex items-center gap-2">
                    <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="e.g. Stethoscope" />
                    <Button type="button" variant="outline" onClick={() => setIconPickerOpen(true)}>Pick</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5"><Label>Image</Label><InfoDot text="Choose either upload or URL mode. Final value is stored as image_url." /></div>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant={imageInputMode === "upload" ? "default" : "outline"} onClick={() => setImageInputMode("upload")}>Upload</Button>
                    <Button type="button" size="sm" variant={imageInputMode === "url" ? "default" : "outline"} onClick={() => setImageInputMode("url")}>Use URL</Button>
                    <InfoDot text="Upload stores to your configured storage bucket. URL mode accepts public URLs or local paths." />
                  </div>
                  {imageInputMode === "upload" ? (
                    <div className="space-y-2">
                      <ImageUpload
                        value={form.image_url}
                        onChange={(url) => setForm({ ...form, image_url: url })}
                        folder="announcements"
                        aspectRatio="16:9"
                      />
                      {form.image_url && (
                        <p className="text-xs text-muted-foreground break-all">{form.image_url}</p>
                      )}
                    </div>
                  ) : (
                    <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://... or /local-path" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5"><Label>Body (rich text)</Label><InfoDot text="Supports formatted text. HTML is sanitized before save." /></div>
                  <RichTextEditor value={form.body} onChange={(v) => setForm({ ...form, body: v })} />
                </div>
              </TabsContent>

              <TabsContent value="ctas" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5"><Label>Primary CTA label</Label><InfoDot text="Main action button text shown to the user." /></div>
                    <Input value={form.primary_cta_label} onChange={(e) => setForm({ ...form, primary_cta_label: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5"><Label>Primary CTA URL</Label><InfoDot text="Can be internal (/route) or full external URL." /></div>
                    <Input value={form.primary_cta_url} onChange={(e) => setForm({ ...form, primary_cta_url: e.target.value })} placeholder="/book or https://..." />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5"><Label>Secondary CTA label</Label><InfoDot text="Optional second action label, usually a subtle link." /></div>
                    <Input value={form.secondary_cta_label} onChange={(e) => setForm({ ...form, secondary_cta_label: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5"><Label>Secondary CTA URL</Label><InfoDot text="Optional second action destination URL." /></div>
                    <Input value={form.secondary_cta_url} onChange={(e) => setForm({ ...form, secondary_cta_url: e.target.value })} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="placement" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5"><Label>Placements <span className="text-destructive">*</span></Label><InfoDot text="Where the announcement can render: top bar, popup, inline, etc." /></div>
                  <div className="grid grid-cols-2 gap-2">
                    {PLACEMENTS.map((p) => (
                      <label key={p} className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-muted/30">
                        <input type="checkbox" checked={form.placements.includes(p)} onChange={() => togglePlacement(p)} />
                        <span className="font-mono text-xs">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {form.placements.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Expand a placement to edit its settings. Collapse sections above to jump to the next.
                    </p>
                    <Accordion
                      key={form.placements.join("-")}
                      type="multiple"
                      defaultValue={[form.placements[form.placements.length - 1]!]}
                      className="rounded-lg border px-3"
                    >
                      {form.placements.map((p) => {
                        const placementTriggerType = form.presentation[p]?.trigger?.type ?? "__inherit__";
                        const placementTriggerValue = form.presentation[p]?.trigger?.value;
                        const previewVariant = form.presentation[p]?.variant ?? PLACEMENT_VARIANTS[p][0];
                        return (
                          <AccordionItem key={p} value={p} className="border-b last:border-b-0">
                            <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                              <span className="font-mono">{p}</span>
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                {previewVariant}
                                {placementTriggerType !== "__inherit__" ? ` · ${placementTriggerType}` : ""}
                                {p === "inline" && (form.presentation.inline?.pages?.length ?? 0) > 0
                                  ? ` · ${form.presentation.inline!.pages!.length} page(s)`
                                  : ""}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-3 pb-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5"><Label>Variant</Label><InfoDot text="Visual style preset for this specific placement." /></div>
                                <Select value={form.presentation[p]?.variant ?? PLACEMENT_VARIANTS[p][0]} onValueChange={(v) => setVariant(p, v)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {PLACEMENT_VARIANTS[p].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5"><Label>Trigger override</Label><InfoDot text="Override global trigger only for this placement." /></div>
                                <Select value={placementTriggerType} onValueChange={(v) => setPlacementTriggerType(p, v)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__inherit__">Inherit global trigger</SelectItem>
                                    {TRIGGER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>

                              {placementTriggerType !== "__inherit__" && TRIGGER_VALUE_TYPES.includes(placementTriggerType as TriggerType) && (
                                <div className="space-y-2">
                                  <Label>
                                    {placementTriggerType === "delay" && "Delay (ms)"}
                                    {placementTriggerType === "scroll_percent" && "Scroll percent (5-95)"}
                                    {placementTriggerType === "idle" && "Idle seconds"}
                                  </Label>
                                  <Input
                                    type="number"
                                    value={placementTriggerValue ?? ""}
                                    onChange={(e) => setPlacementTriggerValue(p, parseInt(e.target.value, 10) || 0)}
                                  />
                                </div>
                              )}

                              {p === "inline" && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5">
                                    <Label>Pages</Label>
                                    <InfoDot text="Limit inline cards to specific routes. None selected = all pages (Targeting rules still apply)." />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {PUBLIC_SITE_PAGES.map((page) => {
                                      const selected = (form.presentation.inline?.pages ?? []).includes(page.path);
                                      return (
                                        <label
                                          key={page.path}
                                          className={`flex items-center gap-2 rounded-md border p-2.5 cursor-pointer transition-colors ${selected ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}
                                        >
                                          <Checkbox
                                            checked={selected}
                                            onCheckedChange={() => togglePlacementPage("inline", page.path)}
                                          />
                                          <span className="text-sm leading-tight">{page.label}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                  {(form.presentation.inline?.pages?.length ?? 0) > 0 && (
                                    <p className="text-[11px] text-muted-foreground">
                                      Showing on {form.presentation.inline!.pages!.length} page
                                      {form.presentation.inline!.pages!.length === 1 ? "" : "s"}.
                                    </p>
                                  )}
                                </div>
                              )}

                              <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                                <div className="text-xs font-medium text-muted-foreground">Preview: {p} ({previewVariant})</div>
                                <AnnouncementAdminPreview
                                  type={form.type}
                                  title={form.title}
                                  body={form.body}
                                  imageUrl={form.image_url}
                                  icon={form.icon}
                                  severity={form.severity}
                                  metadata={metadataObject}
                                  primaryCtaLabel={form.primary_cta_label}
                                  primaryCtaUrl={form.primary_cta_url}
                                  secondaryCtaLabel={form.secondary_cta_label}
                                  secondaryCtaUrl={form.secondary_cta_url}
                                  placement={p}
                                  variant={previewVariant}
                                  theme={previewTheme}
                                  startAt={form.start_at ? new Date(form.start_at).toISOString() : undefined}
                                  endAt={form.end_at ? new Date(form.end_at).toISOString() : undefined}
                                />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </>
                )}
              </TabsContent>

              <TabsContent value="theme" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label>Pick a Look</Label>
                  <p className="text-xs text-muted-foreground">Choose a color preset, then review stacked placement previews below. Fine-tune colors in Advanced.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {LOOK_PRESETS.map((preset) => {
                      const selected =
                        form.theme.badge_style === preset.theme.badge_style &&
                        form.theme.layout_density === preset.theme.layout_density &&
                        form.theme.accent_color === preset.theme.accent_color &&
                        form.theme.background_color === preset.theme.background_color;
                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, theme: { ...f.theme, ...preset.theme } }))}
                          className={`rounded-lg border p-3 text-left transition-colors ${selected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/30"}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-sm">{preset.label}</div>
                            <div className="flex shrink-0 -space-x-1" title="Accent, background, text">
                              <span className="h-4 w-4 rounded-full border-2 border-background shadow-sm" style={{ backgroundColor: preset.theme.accent_color }} />
                              <span className="h-4 w-4 rounded-full border-2 border-background shadow-sm" style={{ backgroundColor: preset.theme.background_color }} />
                              <span className="h-4 w-4 rounded-full border-2 border-background shadow-sm" style={{ backgroundColor: preset.theme.text_color }} />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
                          <div className="mt-2">
                            <span className="text-[11px] text-muted-foreground capitalize">{preset.theme.badge_style} badge · {preset.theme.layout_density}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.placements.length > 0 && (
                  <div className="space-y-3 rounded-lg border p-3">
                    <Label>Placement previews</Label>
                    <p className="text-xs text-muted-foreground">Each selected placement with your current content and look.</p>
                    <div className="flex flex-col gap-4">
                      {form.placements.map((p) => {
                        const variant = form.presentation[p]?.variant ?? PLACEMENT_VARIANTS[p][0];
                        return (
                          <div key={`look-preview-${p}`} className="rounded-md border p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold uppercase text-muted-foreground">{p.replace(/_/g, " ")}</span>
                              <span className="text-[10px] text-muted-foreground">{variant}</span>
                            </div>
                            <AnnouncementAdminPreview
                              type={form.type}
                              title={form.title}
                              body={form.body}
                              imageUrl={form.image_url}
                              icon={form.icon}
                              severity={form.severity}
                              metadata={metadataObject}
                              primaryCtaLabel={form.primary_cta_label}
                              primaryCtaUrl={form.primary_cta_url}
                              secondaryCtaLabel={form.secondary_cta_label}
                              secondaryCtaUrl={form.secondary_cta_url}
                              placement={p}
                              variant={variant}
                              theme={previewTheme}
                              startAt={form.start_at ? new Date(form.start_at).toISOString() : undefined}
                              endAt={form.end_at ? new Date(form.end_at).toISOString() : undefined}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5"><Label>Starts at</Label><InfoDot text="Absolute start date-time from when this announcement can appear." /></div>
                    <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5"><Label>Ends at</Label><InfoDot text="Absolute end date-time after which it stops rendering." /></div>
                    <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.time_window_enabled}
                    onCheckedChange={(checked) => setForm({ ...form, time_window_enabled: checked })}
                  />
                  <Label>Enable recurring time window</Label>
                </div>

                {form.time_window_enabled && (
                  <div className="space-y-4 rounded-lg border p-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Start time</Label>
                        <Input
                          type="time"
                          value={form.time_window.start_time}
                          onChange={(e) => setForm({ ...form, time_window: { ...form.time_window, start_time: e.target.value } })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End time</Label>
                        <Input
                          type="time"
                          value={form.time_window.end_time}
                          onChange={(e) => setForm({ ...form, time_window: { ...form.time_window, end_time: e.target.value } })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Input
                          value={form.time_window.timezone}
                          onChange={(e) => setForm({ ...form, time_window: { ...form.time_window, timezone: e.target.value } })}
                          placeholder="Asia/Kolkata"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Days of week (empty = every day)</Label>
                      <div className="flex flex-wrap gap-2">
                        {DAY_LABELS.map((day) => {
                          const checked = (form.time_window.days_of_week ?? []).includes(day.value);
                          return (
                            <label key={day.value} className="flex items-center gap-2 rounded border px-3 py-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const prev = form.time_window.days_of_week ?? [];
                                  const next = e.target.checked ? [...prev, day.value] : prev.filter((d) => d !== day.value);
                                  setForm({ ...form, time_window: { ...form.time_window, days_of_week: next } });
                                }}
                              />
                              <span className="text-sm">{day.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="frequency" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5"><Label>Strategy</Label><InfoDot text="Frequency controls how often the same user sees this announcement." /></div>
                  <Select value={form.frequency.strategy} onValueChange={(v) => setForm({ ...form, frequency: { ...form.frequency, strategy: v } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_STRATEGIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, frequency: { strategy: "always" } })}>Always show</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, frequency: { strategy: "once_per_day" } })}>Once per day</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, frequency: { strategy: "once_per_session" } })}>Once per session</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, frequency: { strategy: "cooldown", cooldown_hours: 24 } })}>Cooldown 24h</Button>
                  </div>
                </div>

                {form.frequency.strategy === "cooldown" && (
                  <div className="space-y-2">
                    <Label>Cooldown (hours)</Label>
                    <Input type="number" min={1} value={form.frequency.cooldown_hours ?? 24} onChange={(e) => setForm({ ...form, frequency: { ...form.frequency, cooldown_hours: parseInt(e.target.value, 10) || 1 } })} />
                  </div>
                )}

                {form.frequency.strategy === "max_impressions" && (
                  <div className="space-y-2">
                    <Label>Max impressions</Label>
                    <Input type="number" min={1} value={form.frequency.max_impressions ?? 3} onChange={(e) => setForm({ ...form, frequency: { ...form.frequency, max_impressions: parseInt(e.target.value, 10) || 1 } })} />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5"><Label>Global trigger</Label><InfoDot text="When to show announcement unless a placement-specific override exists." /></div>
                  <Select value={form.trigger.type} onValueChange={(v) => setForm({ ...form, trigger: { ...form.trigger, type: v as TriggerType } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRIGGER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {TRIGGER_VALUE_TYPES.includes(form.trigger.type) && (
                  <div className="space-y-2">
                    <Label>
                      {form.trigger.type === "delay" && "Delay (ms)"}
                      {form.trigger.type === "scroll_percent" && "Scroll percent (5-95)"}
                      {form.trigger.type === "idle" && "Idle seconds"}
                    </Label>
                    <Input type="number" value={form.trigger.value ?? ""} onChange={(e) => setForm({ ...form, trigger: { ...form.trigger, value: parseInt(e.target.value, 10) || 0 } })} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="targeting" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5"><Label>Devices</Label><InfoDot text="Device classes where this announcement is eligible to render." /></div>
                  <div className="flex flex-wrap gap-2">
                    {DEVICES.map((d) => (
                      <label key={d} className="flex items-center gap-2 rounded border px-3 py-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.devices.includes(d)}
                          onChange={(e) => {
                            const next = e.target.checked ? [...form.devices, d] : form.devices.filter((x) => x !== d);
                            setForm({ ...form, devices: next });
                          }}
                        />
                        <span className="text-sm">{d}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5"><Label>Audience</Label><InfoDot text="Target user segments such as all/new/returning/authenticated/guest." /></div>
                  <div className="flex flex-wrap gap-2">
                    {AUDIENCES.map((a) => (
                      <label key={a} className="flex items-center gap-2 rounded border px-3 py-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.audience.includes(a)}
                          onChange={(e) => {
                            const next = e.target.checked ? [...form.audience, a] : form.audience.filter((x) => x !== a);
                            setForm({ ...form, audience: next });
                          }}
                        />
                        <span className="text-sm">{a}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5"><Label>Include paths (one per line, supports * and **)</Label><InfoDot text="If set, announcement appears only on matching paths." /></div>
                  <Textarea
                    value={(form.page_rules.include ?? []).join("\n")}
                    onChange={(e) => setForm({ ...form, page_rules: { ...form.page_rules, include: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) } })}
                    placeholder="/&#10;/tests/**&#10;/blog/*"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5"><Label>Exclude paths</Label><InfoDot text="Any matching path here hides the announcement even if include matches." /></div>
                  <Textarea
                    value={(form.page_rules.exclude ?? []).join("\n")}
                    onChange={(e) => setForm({ ...form, page_rules: { ...form.page_rules, exclude: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) } })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-0">
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="text-sm font-semibold">Color & visual controls (advanced)</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Accent color</Label>
                      <Input type="color" value={form.theme.accent_color || "#10b981"} onChange={(e) => setForm({ ...form, theme: { ...form.theme, accent_color: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Background color</Label>
                      <Input type="color" value={form.theme.background_color || "#ffffff"} onChange={(e) => setForm({ ...form, theme: { ...form.theme, background_color: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Text color</Label>
                      <Input type="color" value={form.theme.text_color || "#111827"} onChange={(e) => setForm({ ...form, theme: { ...form.theme, text_color: e.target.value } })} />
                    </div>
                  </div>
                </div>

                {metadataFields.length > 0 && (
                  <div className="space-y-3 rounded-lg border p-3">
                    <div className="text-sm font-semibold">Structured metadata for type: {form.type}</div>
                    {metadataFields.map((field) => {
                      const rawValue = metadataObject[field.key];
                      const options = METADATA_OPTIONS[field.key] ?? [];
                      if (field.type === "boolean") {
                        return (
                          <div key={field.key} className="flex items-center gap-2">
                            <Switch
                              checked={Boolean(rawValue)}
                              onCheckedChange={(v) => setMetadataField(field.key, field.type, v)}
                            />
                            <Label>{field.label}</Label>
                            <Button type="button" size="sm" variant="outline" onClick={() => setMetadataField(field.key, field.type, true)}>True</Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setMetadataField(field.key, field.type, false)}>False</Button>
                          </div>
                        );
                      }

                      if (field.type === "textarea") {
                        return (
                          <div key={field.key} className="space-y-2">
                            <Label>{field.label}</Label>
                            <Textarea
                              rows={3}
                              value={typeof rawValue === "string" ? rawValue : ""}
                              onChange={(e) => setMetadataField(field.key, "text", e.target.value)}
                              placeholder={field.placeholder}
                            />
                            <MetadataSuggestionChips
                              fieldKey={field.key}
                              options={options}
                              onSelect={(opt) => setMetadataField(field.key, "text", opt)}
                            />
                          </div>
                        );
                      }

                      if (field.type === "string_array") {
                        return (
                          <div key={field.key} className="space-y-2">
                            <div className="flex items-center gap-1.5"><Label>{field.label}</Label></div>
                            <Input
                              value={Array.isArray(rawValue) ? rawValue.join(", ") : ""}
                              onChange={(e) => setMetadataField(field.key, field.type, e.target.value)}
                              placeholder={field.placeholder}
                            />
                            <MetadataSuggestionChips
                              fieldKey={field.key}
                              options={options}
                              onSelect={(opt) => setMetadataField(field.key, field.type, opt)}
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={field.key} className="space-y-2">
                          <div className="flex items-center gap-1.5"><Label>{field.label}</Label></div>
                          <Input
                            type={field.type === "number" ? "number" : "text"}
                            value={typeof rawValue === "number" || typeof rawValue === "string" ? String(rawValue) : ""}
                            onChange={(e) => setMetadataField(field.key, field.type, e.target.value)}
                            placeholder={field.placeholder}
                          />
                          <MetadataSuggestionChips
                            fieldKey={field.key}
                            options={options}
                            onSelect={(opt) => setMetadataField(field.key, field.type, opt)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                <Accordion type="multiple" className="rounded-lg border px-3">
                  <AccordionItem value="metadata-json" className="border-b last:border-b-0">
                    <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                      <span className="flex items-center gap-1.5">
                        Metadata JSON
                        <InfoDot text="Raw metadata object. Structured fields above update this automatically." />
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pb-4">
                      <Textarea
                        rows={10}
                        className="font-mono text-xs"
                        value={form.metadataJson}
                        onChange={(e) => setForm({ ...form, metadataJson: e.target.value })}
                      />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="generated-json" className="border-b-0">
                    <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                      <span className="flex items-center gap-1.5">
                        Generated full announcement JSON
                        <InfoDot text="Complete payload generated from all steps. Copy and paste this to quickly re-create or test." />
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pb-4">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(generatedPayloadText);
                              toast({ title: "Copied", description: "Generated payload copied to clipboard." });
                            } catch {
                              toast({ title: "Copy failed", description: "Clipboard permission blocked.", variant: "destructive" });
                            }
                          }}
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy JSON
                        </Button>
                      </div>
                      <Textarea rows={14} className="font-mono text-xs" value={generatedPayloadText} readOnly />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="border-t pt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            {!isFirstStep && (
              <Button type="button" variant="outline" onClick={goPrevStep} disabled={saving}>Back</Button>
            )}
            {!isLastStep && (
              <Button type="button" variant="outline" onClick={goNextStep} disabled={saving}>Next</Button>
            )}
            <Button type="button" onClick={() => void save(false)} disabled={saving}>
              {saving && !publishOnSave ? "Saving..." : editing ? "Save changes" : "Save as Draft"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setPublishOnSave(true); void save(true); }}
              disabled={saving}
              title={editing ? "Save & publish" : "Save & publish immediately"}
            >
              {saving && publishOnSave ? "Publishing..." : "Publish now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <IconSelector
        open={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        onSelect={(name) => { setForm((f) => ({ ...f, icon: name })); setIconPickerOpen(false); }}
        currentIcon={form.icon}
      />
    </div>
  );
};

export default AdminAnnouncements;
