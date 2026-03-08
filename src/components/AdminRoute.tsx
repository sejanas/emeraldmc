import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Non-active statuses that are still allowed to access the profile page
const PROFILE_ALLOWED_STATUSES = ["pending", "declined"];

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
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

  return <>{children}</>;
};

export default AdminRoute;
