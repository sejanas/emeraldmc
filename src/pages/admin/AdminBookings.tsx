import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  sample_collected: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  sample_collected: "Sample Collected",
  completed: "Completed",
  cancelled: "Cancelled",
};

const AdminBookings = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get("/bookings");
      setBookings(data);
    } catch (err: any) {
      toast({ title: "Error loading bookings", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      toast({ title: `Status updated to ${statusLabels[status]}` });
      load();
      if (selected?.id === id) setSelected({ ...selected, status });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Bookings</h1>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Patient</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Phone</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{b.patient_name}</td>
                <td className="px-4 py-3">{b.phone}</td>
                <td className="px-4 py-3">{b.preferred_date}</td>
                <td className="px-4 py-3">{b.preferred_time}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[b.status] || ""}`}>{statusLabels[b.status] || b.status}</span>
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(b)}>View</Button>
                  <Select value={b.status} onValueChange={(v) => updateStatus(b.id, v)}>
                    <SelectTrigger className="h-8 w-[140px] inline-flex"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-6 text-center text-muted-foreground">Loading...</p>}
        {!loading && !bookings.length && <p className="p-6 text-center text-muted-foreground">No bookings yet.</p>}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Booking Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div><strong>Patient:</strong> {selected.patient_name}</div>
              <div><strong>Phone:</strong> {selected.phone}</div>
              {selected.email && <div><strong>Email:</strong> {selected.email}</div>}
              <div><strong>Date:</strong> {selected.preferred_date}</div>
              <div><strong>Time:</strong> {selected.preferred_time}</div>
              {selected.address && <div><strong>Address:</strong> {selected.address}</div>}
              {selected.selected_tests?.length > 0 && <div><strong>Tests:</strong> {selected.selected_tests.join(", ")}</div>}
              {selected.selected_package && <div><strong>Package:</strong> {selected.selected_package}</div>}
              {selected.notes && <div><strong>Notes:</strong> {selected.notes}</div>}
              <div><strong>Status:</strong> <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[selected.status] || ""}`}>{statusLabels[selected.status]}</span></div>
              <div><strong>Created:</strong> {new Date(selected.created_at).toLocaleString()}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;
