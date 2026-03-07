import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { CheckCircle, XCircle, ArrowUpCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  revoked: "bg-destructive/10 text-destructive",
};

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/users");
      setUsers(data);
    } catch (err: any) {
      toast({ title: "Error loading users", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const action = async (endpoint: string, user_id: string, label: string) => {
    try {
      await api.post(`/admin/${endpoint}`, { user_id });
      toast({ title: `User ${label}` });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.clinic_role || "—"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium">{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[u.status] || ""}`}>{u.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {(u.emails ?? []).map((e: any) => e.email).join(", ")}
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  {u.status === "pending" && (
                    <Button variant="ghost" size="sm" onClick={() => action("approve-user", u.user_id, "approved")}>
                      <CheckCircle className="h-4 w-4 text-primary mr-1" /> Approve
                    </Button>
                  )}
                  {u.status === "active" && u.role !== "super_admin" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => action("promote-user", u.user_id, "promoted")}>
                        <ArrowUpCircle className="h-4 w-4 text-primary mr-1" /> Promote
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => action("revoke-user", u.user_id, "revoked")}>
                        <XCircle className="h-4 w-4 text-destructive mr-1" /> Revoke
                      </Button>
                    </>
                  )}
                  {u.status === "revoked" && (
                    <Button variant="ghost" size="sm" onClick={() => action("approve-user", u.user_id, "reactivated")}>
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
