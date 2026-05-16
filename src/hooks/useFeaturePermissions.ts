import { useSiteSettings } from "./useSiteSettings";

export const ADMIN_FEATURES = [
  { key: "dashboard", label: "Dashboard", group: "General" },
  { key: "categories", label: "Categories", group: "Catalog" },
  { key: "tests", label: "Tests", group: "Catalog" },
  { key: "packages", label: "Packages", group: "Catalog" },
  { key: "doctors", label: "Doctors", group: "Content" },
  { key: "gallery", label: "Gallery", group: "Content" },
  { key: "bookings", label: "Bookings", group: "Top" },
  { key: "blog", label: "Blog", group: "Content" },
  { key: "faqs", label: "FAQs", group: "Content" },
  { key: "certifications", label: "Certifications", group: "Content" },
  { key: "statistics", label: "Statistics", group: "Content" },
  { key: "reports", label: "Reports", group: "Content" },
  { key: "features", label: "Features", group: "Content" },
  { key: "homepage", label: "Homepage Sections", group: "Content" },
  { key: "announcements", label: "Announcements", group: "Content" },
  { key: "visitors", label: "Visitors", group: "Analytics" },
  { key: "activity_logs", label: "Activity Logs", group: "Analytics" },
  { key: "users", label: "Users", group: "System" },
  { key: "theme", label: "Theme", group: "System" },
  { key: "settings", label: "Settings", group: "System" },
] as const;

export type FeatureKey = (typeof ADMIN_FEATURES)[number]["key"];
export type ConfigurableRole = "admin" | "booking_manager";

export const CONFIGURABLE_ROLES: { key: ConfigurableRole; label: string }[] = [
  { key: "admin", label: "Admin" },
  { key: "booking_manager", label: "Booking Manager" },
];

export const DEFAULT_FEATURE_ROLES: Record<FeatureKey, ConfigurableRole[]> = {
  dashboard: ["admin", "booking_manager"],
  categories: ["admin"],
  tests: ["admin"],
  packages: ["admin"],
  doctors: ["admin"],
  gallery: ["admin"],
  bookings: ["admin", "booking_manager"],
  blog: ["admin"],
  faqs: ["admin"],
  certifications: ["admin"],
  statistics: ["admin"],
  reports: ["admin"],
  features: ["admin"],
  homepage: ["admin"],
  announcements: ["admin"],
  visitors: ["admin"],
  activity_logs: ["admin"],
  users: [],
  theme: [],
  settings: [],
};

/** Map admin route paths to feature keys */
export const PATH_TO_FEATURE: Record<string, FeatureKey> = {
  "/admin": "dashboard",
  "/admin/categories": "categories",
  "/admin/tests": "tests",
  "/admin/packages": "packages",
  "/admin/doctors": "doctors",
  "/admin/gallery": "gallery",
  "/admin/bookings": "bookings",
  "/admin/blog": "blog",
  "/admin/faqs": "faqs",
  "/admin/certifications": "certifications",
  "/admin/statistics": "statistics",
  "/admin/reports": "reports",
  "/admin/features": "features",
  "/admin/homepage": "homepage",
  "/admin/announcements": "announcements",
  "/admin/visitors": "visitors",
  "/admin/activity-logs": "activity_logs",
  "/admin/users": "users",
  "/admin/theme": "theme",
  "/admin/settings": "settings",
};

export function useFeaturePermissions() {
  const { data: allSettings, isLoading } = useSiteSettings();

  const stored: Record<string, ConfigurableRole[]> | null = Array.isArray(allSettings)
    ? (allSettings.find((s: any) => s.key === "feature_permissions")?.value ?? null)
    : null;

  const permissions: Record<FeatureKey, ConfigurableRole[]> = {} as any;
  for (const f of ADMIN_FEATURES) {
    permissions[f.key] = stored?.[f.key] ?? DEFAULT_FEATURE_ROLES[f.key];
  }

  function canAccess(feature: FeatureKey, role: string | undefined): boolean {
    if (!role) return false;
    if (role === "super_admin") return true;
    return permissions[feature]?.includes(role as ConfigurableRole) ?? false;
  }

  return { permissions, canAccess, isLoading };
}
