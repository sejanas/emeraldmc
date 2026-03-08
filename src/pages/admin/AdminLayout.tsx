import { NavLink, Outlet } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LayoutDashboard, List, FlaskConical, Package, Users, Image, LogOut, CalendarCheck, Shield, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";

const AdminLayout = () => {
  const { signOut, profile, isSuperAdmin } = useAuth();

  const links = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/admin/categories", icon: List, label: "Categories" },
    { to: "/admin/tests", icon: FlaskConical, label: "Tests" },
    { to: "/admin/packages", icon: Package, label: "Packages" },
    { to: "/admin/doctors", icon: Users, label: "Doctors" },
    { to: "/admin/gallery", icon: Image, label: "Gallery" },
    { to: "/admin/bookings", icon: CalendarCheck, label: "Bookings" },
    { to: "/admin/activity-logs", icon: Activity, label: "Activity Logs" },
    ...(isSuperAdmin ? [{ to: "/admin/users", icon: Shield, label: "Users" }] : []),
  ];

  return (
    <div className="flex h-screen bg-muted/30">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:flex md:flex-col h-screen overflow-auto">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">E</span>
          </div>
          <span className="font-display text-sm font-semibold flex-1">Admin Panel</span>
          <ThemeToggle />
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {links.map((l) => (
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
          ))}
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
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">E</span>
          </div>
          <span className="font-display text-sm font-semibold flex-1">Admin</span>
          <div className="flex gap-1 overflow-x-auto">
            {links.slice(0, 5).map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => `rounded-md px-2 py-1 text-xs whitespace-nowrap ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                {l.label}
              </NavLink>
            ))}
          </div>
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
