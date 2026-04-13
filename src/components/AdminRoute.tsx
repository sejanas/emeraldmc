import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFeaturePermissions, PATH_TO_FEATURE } from "@/hooks/useFeaturePermissions";

const PROFILE_ALLOWED_STATUSES = ["pending", "declined"];

/** Paths that are always accessible to any authenticated admin-level user */
const ALWAYS_ALLOWED = ["/admin/profile"];

/** Paths restricted to super_admin only (not in the RBAC matrix) */
const SUPER_ADMIN_ONLY = ["/admin/access-control"];

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, isSuperAdmin, profile, loading } = useAuth();
  const { canAccess, isLoading: permissionsLoading } = useFeaturePermissions();
  const location = useLocation();

  if (loading || permissionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  // Pending/declined users can only access the profile page
  if (profile && PROFILE_ALLOWED_STATUSES.includes(profile.status)) {
    if (location.pathname !== "/admin/profile") {
      return <Navigate to="/admin/profile" replace />;
    }
    return <>{children}</>;
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const role = profile?.role;
  const path = location.pathname;

  // Always-allowed paths
  if (ALWAYS_ALLOWED.some((p) => path === p || path.startsWith(p + "/"))) {
    return <>{children}</>;
  }

  // Super-admin-only system paths
  if (SUPER_ADMIN_ONLY.some((p) => path === p || path.startsWith(p + "/"))) {
    if (!isSuperAdmin) return <Navigate to="/admin" replace />;
    return <>{children}</>;
  }

  // Dashboard: accessible to admin + super_admin, redirect others to first allowed page
  if (path === "/admin") {
    if (role === "admin" || role === "super_admin") return <>{children}</>;
    // Find first feature-path the user can access
    const firstAllowed = Object.entries(PATH_TO_FEATURE).find(([, fk]) => canAccess(fk, role));
    return <Navigate to={firstAllowed ? firstAllowed[0] : "/admin/profile"} replace />;
  }

  // Feature-gated paths: check dynamic permissions
  const featureKey = PATH_TO_FEATURE[path] ?? Object.entries(PATH_TO_FEATURE).find(
    ([p]) => path.startsWith(p + "/")
  )?.[1];

  if (featureKey) {
    if (!canAccess(featureKey, role)) {
      // Redirect to dashboard (admin/super_admin) or first allowed path
      if (role === "admin" || role === "super_admin") return <Navigate to="/admin" replace />;
      const firstAllowed = Object.entries(PATH_TO_FEATURE).find(([, fk]) => canAccess(fk, role));
      return <Navigate to={firstAllowed ? firstAllowed[0] : "/admin/profile"} replace />;
    }
  }

  return <>{children}</>;
};

export default AdminRoute;
