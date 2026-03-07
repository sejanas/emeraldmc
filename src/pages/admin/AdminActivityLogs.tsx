import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const AdminActivityLogs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/activity-logs")
      .then(setLogs)
      .catch((err) => toast({ title: "Error loading logs", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const formatEvent = (event: string) => {
    const [entity, action] = event.split(".");
    return (
      <span>
        <span className="font-medium text-foreground">{entity}</span>
        <span className="text-muted-foreground">.{action}</span>
      </span>
    );
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Activity Logs</h1>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Event</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Entity</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Changes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-border">
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">{formatEvent(log.event_type)}</td>
                <td className="px-4 py-3 text-muted-foreground">{log.entity_name || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                  {log.changes ? JSON.stringify(log.changes) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-6 text-center text-muted-foreground">Loading...</p>}
        {!loading && !logs.length && <p className="p-6 text-center text-muted-foreground">No activity logs yet.</p>}
      </div>
    </div>
  );
};

export default AdminActivityLogs;
