import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LayoutDashboard, List, FlaskConical, Package, Users, Image, LogOut, CalendarCheck, Shield, Activity, UserCircle, HelpCircle, Eye, Palette, FileText, Award, Settings, ChevronDown, LayoutGrid, BarChart3, Layers, ShieldCheck, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useFeaturePermissions, PATH_TO_FEATURE } from "@/hooks/useFeaturePermissions";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import SessionTimeoutDialog from "@/components/SessionTimeoutDialog";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  icon: any;
  label: string;
  end?: boolean;
  roles: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const AdminLayout = () => {
  const { signOut, profile, isSuperAdmin, isBookingManager } = useAuth();
  const location = useLocation();

  const allLinks: NavItem[] = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true, roles: ["admin", "super_admin"] },
    { to: "/admin/categories", icon: List, label: "Categories", roles: ["admin", "super_admin"] },
    { to: "/admin/tests", icon: FlaskConical, label: "Tests", roles: ["admin", "super_admin"] },
    { to: "/admin/packages", icon: Package, label: "Packages", roles: ["admin", "super_admin"] },
    { to: "/admin/doctors", icon: Users, label: "Doctors", roles: ["admin", "super_admin"] },
    { to: "/admin/gallery", icon: Image, label: "Gallery", roles: ["admin", "super_admin"] },
    { to: "/admin/bookings", icon: CalendarCheck, label: "Bookings", roles: ["admin", "super_admin", "booking_manager"] },
    { to: "/admin/blog", icon: FileText, label: "Blog", roles: ["admin", "super_admin"] },
    { to: "/admin/faqs", icon: HelpCircle, label: "FAQs", roles: ["admin", "super_admin"] },
    { to: "/admin/certifications", icon: Award, label: "Certifications", roles: ["admin", "super_admin"] },
    { to: "/admin/statistics", icon: BarChart3, label: "Statistics", roles: ["admin", "super_admin"] },
    { to: "/admin/reports", icon: FileText, label: "Reports", roles: ["admin", "super_admin"] },
    { to: "/admin/features", icon: Layers, label: "Features", roles: ["admin", "super_admin"] },
    { to: "/admin/homepage", icon: LayoutGrid, label: "Homepage", roles: ["admin", "super_admin"] },
    { to: "/admin/hero-slides", icon: Image, label: "Hero Slides", roles: ["admin", "super_admin"] },
    { to: "/admin/announcements", icon: Megaphone, label: "Announcements", roles: ["admin", "super_admin"] },
    { to: "/admin/visitors", icon: Eye, label: "Visitors", roles: ["admin", "super_admin"] },
    { to: "/admin/activity-logs", icon: Activity, label: "Activity Logs", roles: ["admin", "super_admin"] },
    { to: "/admin/profile", icon: UserCircle, label: "My Profile", roles: ["admin", "super_admin", "booking_manager"] },
    { to: "/admin/users", icon: Shield, label: "Users", roles: ["super_admin"] },
    { to: "/admin/theme", icon: Palette, label: "Theme", roles: ["super_admin"] },
    { to: "/admin/settings", icon: Settings, label: "Settings", roles: ["super_admin"] },
    { to: "/admin/access-control", icon: ShieldCheck, label: "Access Control", roles: ["super_admin"] },
  ];

  const { canAccess } = useFeaturePermissions();
  const userRole = profile?.role || "booking_manager";
  const links = allLinks.filter((l) => {
    const featureKey = PATH_TO_FEATURE[l.to];
    if (featureKey) return canAccess(featureKey, userRole);
    return l.roles.includes(userRole);
  });

  // Group links into accordion sections
  const navGroups: NavGroup[] = useMemo(() => {
    const catalogPaths = ["/admin/categories", "/admin/tests", "/admin/packages"];
    const contentPaths = ["/admin/doctors", "/admin/gallery", "/admin/blog", "/admin/faqs", "/admin/certifications", "/admin/statistics", "/admin/reports", "/admin/features", "/admin/homepage", "/admin/hero-slides", "/admin/announcements"];
    const analyticsPaths = ["/admin/visitors", "/admin/activity-logs"];
    const systemPaths = ["/admin/users", "/admin/theme", "/admin/settings", "/admin/access-control"];

    const groups: NavGroup[] = [];

    // Dashboard & Bookings always top-level
    const topLevel = links.filter((l) => l.to === "/admin" || l.to === "/admin/bookings");
    if (topLevel.length > 0) groups.push({ label: "", items: topLevel });

    const catalog = links.filter((l) => catalogPaths.includes(l.to));
    if (catalog.length > 0) groups.push({ label: "Catalog", items: catalog });

    const content = links.filter((l) => contentPaths.includes(l.to));
    if (content.length > 0) groups.push({ label: "Content", items: content });

    const analytics = links.filter((l) => analyticsPaths.includes(l.to));
    if (analytics.length > 0) groups.push({ label: "Analytics", items: analytics });

    const profile = links.filter((l) => l.to === "/admin/profile");
    const system = links.filter((l) => systemPaths.includes(l.to));
    const accountItems = [...profile, ...system];
    if (accountItems.length > 0) groups.push({ label: "Account", items: accountItems });

    return groups;
  }, [links]);

  // Auto-expand groups that contain the active route
  const getInitialExpanded = () => {
    const expanded: string[] = [];
    navGroups.forEach((g) => {
      if (!g.label) return; // top-level always visible
      const hasActive = g.items.some((item) =>
        item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
      );
      if (hasActive) expanded.push(g.label);
    });
    return expanded;
  };

  const [expanded, setExpanded] = useState<string[]>(getInitialExpanded);

  const toggleGroup = (label: string) => {
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  const renderNavLink = (l: NavItem) => (
    <NavLink
      key={l.to}
      to={l.to}
      end={l.end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`
      }
    >
      <l.icon className="h-4 w-4" />
      {l.label}
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-muted/30">
      <SessionTimeoutDialog />
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:flex md:flex-col h-screen overflow-auto">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">S</span>
          </div>
          <span className="font-display text-sm font-semibold flex-1">Admin Panel</span>
          <NotificationBell />
          <ThemeToggle />
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navGroups.map((group) =>
            !group.label ? (
              // Top-level items (Dashboard, Bookings) — no accordion
              <div key="top" className="flex flex-col gap-1">
                {group.items.map(renderNavLink)}
              </div>
            ) : (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  {group.label}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      expanded.includes(group.label) && "rotate-180"
                    )}
                  />
                </button>
                {expanded.includes(group.label) && (
                  <div className="flex flex-col gap-0.5 ml-1">
                    {group.items.map(renderNavLink)}
                  </div>
                )}
              </div>
            )
          )}
        </nav>
        <div className="border-t border-border p-3">
          {profile && (
            <p className="text-xs text-muted-foreground mb-2 px-3 truncate">
              {profile.name} <span className="text-primary">({profile.role})</span>
            </p>
          )}
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-2 border-b border-border bg-card px-4 md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shrink-0">
            <span className="text-xs font-bold text-primary-foreground">S</span>
          </div>
          <span className="font-display text-sm font-semibold shrink-0">Admin</span>
          <div className="flex-1 overflow-x-auto mx-2">
            <div className="flex gap-1 w-max">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end}
                  className={({ isActive }) => `rounded-md px-2 py-1 text-xs whitespace-nowrap ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>
          <NotificationBell />
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={signOut} className="shrink-0">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
