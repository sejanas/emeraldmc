import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const PROFILE_ALLOWED_STATUSES = ["pending", "declined"];

const BOOKING_MANAGER_PATHS = ["/admin/bookings", "/admin/profile"];

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, isBookingManager, profile, loading } = useAuth();
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

  // Booking managers can only access bookings and profile
  if (isBookingManager) {
    const allowed = BOOKING_MANAGER_PATHS.some(
      (p) => location.pathname === p || location.pathname.startsWith(p + "/")
    );
    // Also allow the base /admin path — redirect to bookings
    if (location.pathname === "/admin") {
      return <Navigate to="/admin/bookings" replace />;
    }
    if (!allowed) {
      return <Navigate to="/admin/bookings" replace />;
    }
  }

  return <>{children}</>;
};

export default AdminRoute;
