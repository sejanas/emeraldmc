import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import useAdminUsers from "@/hooks/useAdminUsers";
import useAdminUserAction from "@/hooks/useAdminUserAction";
import { useConfirm } from "@/components/ConfirmDialog";
import { CheckCircle, XCircle, Activity } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  revoked: "bg-destructive/10 text-destructive",
  declined: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const roleColors: Record<string, string> = {
  booking_manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  admin: "bg-accent text-accent-foreground",
  super_admin: "bg-primary/10 text-primary",
};

const AdminUsers = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const usersQuery = useAdminUsers();
  const users = usersQuery.data ?? [];
  const loading = usersQuery.isLoading;

  const approveUser = useAdminUserAction('approve-user');
  const promoteUser = useAdminUserAction('promote-user');
  const revokeUser = useAdminUserAction('revoke-user');
  const declineUser = useAdminUserAction('decline-user');

  const action = async (endpoint: string, payload: any, label: string) => {
    try {
      if (endpoint === 'approve-user') await approveUser.mutateAsync(payload);
      if (endpoint === 'promote-user') await promoteUser.mutateAsync(payload);
      if (endpoint === 'revoke-user') await revokeUser.mutateAsync(payload);
      if (endpoint === 'decline-user') await declineUser.mutateAsync(payload);
      toast({ title: `User ${label} successfully` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleApprove = async (user_id: string, name: string) => {
    const result = await confirm({
      title: "Approve User",
      description: `Approve account for "${name}"? They will be able to log in immediately.`,
      confirmLabel: "Approve",
      variant: "default",
    });
    if (result.confirmed) action("approve-user", user_id, "approved");
  };

  const handleDecline = async (user_id: string, name: string) => {
    const result = await confirm({
      title: "Decline User",
      description: `Decline account request from "${name}"? They will be notified and may resubmit after a cooling period.`,
      confirmLabel: "Decline",
      cancelLabel: "Cancel",
      variant: "destructive",
      inputLabel: "Reason for declining",
      inputPlaceholder: "e.g. Insufficient information provided",
    });
    if (result.confirmed) {
      action("decline-user", { user_id, decline_reason: result.input }, "declined");
    }
  };

  const handleRevoke = async (user_id: string, name: string) => {
    const result = await confirm({
      title: "Revoke Access",
      description: `Revoke access for "${name}"? They will no longer be able to log in.`,
      confirmLabel: "Revoke",
      variant: "destructive",
    });
    if (result.confirmed) action("revoke-user", user_id, "revoked");
  };

  const handleReactivate = async (user_id: string, name: string) => {
    const result = await confirm({
      title: "Reactivate User",
      description: `Reactivate account for "${name}"?`,
      confirmLabel: "Reactivate",
    });
    if (result.confirmed) action("approve-user", user_id, "reactivated");
  };

  const handleRoleChange = async (user_id: string, name: string, newRole: string) => {
    const result = await confirm({
      title: "Change Role",
      description: `Change role for "${name}" to ${newRole}?`,
      confirmLabel: "Change",
      variant: "destructive",
    });
    if (result.confirmed) {
      action("promote-user", { user_id, target_role: newRole }, `role changed to ${newRole}`);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">User Management</h1>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Clinic Role</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Emails</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Phones</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.clinic_role || "—"}</td>
                <td className="px-4 py-3">
                  {u.status === "active" && u.role !== "super_admin" ? (
                    <Select value={u.role} onValueChange={(v) => handleRoleChange(u.user_id, u.name, v)}>
                      <SelectTrigger className="h-7 w-[150px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="booking_manager">Booking Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[u.role] || "bg-accent text-accent-foreground"}`}>
                      {u.role}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[u.status] || "bg-muted text-muted-foreground"}`}>{u.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {(u.emails ?? []).map((e: any) => e.email).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {(u.phones ?? []).map((p: any) => p.phone).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    title="View Activity"
                    onClick={() => navigate(`/admin/activity-logs?user_id=${u.user_id}&user_name=${encodeURIComponent(u.name)}`)}
                  >
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  {u.status === "pending" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => handleApprove(u.user_id, u.name)}>
                        <CheckCircle className="h-4 w-4 text-primary mr-1" /> Approve
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDecline(u.user_id, u.name)}>
                        <XCircle className="h-4 w-4 text-destructive mr-1" /> Decline
                      </Button>
                    </>
                  )}
                  {u.status === "active" && u.role !== "super_admin" && (
                    <Button variant="ghost" size="sm" onClick={() => handleRevoke(u.user_id, u.name)}>
                      <XCircle className="h-4 w-4 text-destructive mr-1" /> Revoke
                    </Button>
                  )}
                  {u.status === "revoked" && (
                    <Button variant="ghost" size="sm" onClick={() => handleReactivate(u.user_id, u.name)}>
                      <CheckCircle className="h-4 w-4 text-primary mr-1" /> Reactivate
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-6 text-center text-muted-foreground">Loading...</p>}
        {!loading && !users.length && <p className="p-6 text-center text-muted-foreground">No users found.</p>}
      </div>
    </div>
  );
};

export default AdminUsers;
