import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import useActivityLogs from "@/hooks/useActivityLogs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

const ENTITY_TYPES = ["user", "booking", "test", "category", "package", "doctor", "gallery"];

const EVENT_PREFIXES = [
  "user.login", "user.login_failed", "user.signup", "user.profile_updated", "user.resubmitted",
  "admin.approved", "admin.declined", "admin.revoked", "admin.promoted",
  "booking.created", "booking.updated",
  "test.created", "test.updated", "test.deleted",
  "category.created", "category.updated", "category.deleted",
  "package.created", "package.updated", "package.deleted",
  "doctor.created", "doctor.updated", "doctor.deleted",
  "gallery.created", "gallery.updated", "gallery.deleted",
];

const AdminActivityLogs = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [userId, setUserId] = useState(searchParams.get("user_id") ?? "");
  const [userName, setUserName] = useState(searchParams.get("user_name") ?? "");
  const [entityType, setEntityType] = useState(searchParams.get("entity_type") ?? "");
  const [eventType, setEventType] = useState(searchParams.get("event_type") ?? "");

  // Build filters object for the hook – only include non-empty values
  const filters = {
    ...(userId ? { user_id: userId } : {}),
    ...(entityType ? { entity_type: entityType } : {}),
    ...(eventType ? { event_type: eventType } : {}),
  };

  const logsQuery = useActivityLogs(filters);
  const logs = logsQuery.data ?? [];
  const loading = logsQuery.isLoading;

  const clearFilters = () => {
    setUserId("");
    setUserName("");
    setEntityType("");
    setEventType("");
    setSearchParams({});
  };

  const hasFilters = !!(userId || entityType || eventType);

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
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Activity Logs</h1>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-3.5 w-3.5 mr-1" /> Clear Filters
          </Button>
        )}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {userName && (
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
            User: {userName}
            <button onClick={() => { setUserId(""); setUserName(""); setSearchParams(p => { p.delete("user_id"); p.delete("user_name"); return p; }); }}>
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger className="h-8 w-48 text-xs">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_PREFIXES.map((e) => (
              <SelectItem key={e} value={e} className="text-xs">{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Event</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">By</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Entity</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Changes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} className="border-t border-border">
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">{formatEvent(log.event_type)}</td>
                <td className="px-4 py-3 text-xs font-medium text-foreground whitespace-nowrap">
                  {log.actor_name || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{log.entity_name || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                  {log.changes ? JSON.stringify(log.changes) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-6 text-center text-muted-foreground">Loading...</p>}
        {!loading && !logs.length && <p className="p-6 text-center text-muted-foreground">No activity logs found.</p>}
      </div>
  );
};

export default AdminActivityLogs;

