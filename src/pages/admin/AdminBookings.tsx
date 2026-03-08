import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import useBookings from "@/hooks/useBookings";
import {
  useUpdateBookingStatus,
  useAddBookingUpdate,
  useRescheduleBooking,
  useUpdateBookingInfo,
  useBulkUpdateStatus,
} from "@/hooks/useBookingsMutations";
import { useBookingUpdates, usePatientHistory } from "@/hooks/useBookingDetail";
import { CalendarCheck, List, AlertTriangle, Phone, Clock, User, FileText, Plus, X, CheckSquare } from "lucide-react";

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

const STATUS_RANK: Record<string, number> = {
  cancelled: -1,
  pending: 0,
  confirmed: 1,
  sample_collected: 2,
  completed: 3,
};

const updateTypeLabels: Record<string, string> = {
  status_change: "Status Changed",
  follow_up_call: "Follow-up Call",
  note: "Note",
  date_change: "Rescheduled",
  info_update: "Info Updated",
  other: "Other",
};

const STATUSES = ["all", "pending", "confirmed", "sample_collected", "completed", "cancelled"];

function isOverdue(booking: any): boolean {
  if (!["pending", "confirmed"].includes(booking.status)) return false;
  const updatedAt = new Date(booking.updated_at || booking.created_at).getTime();
  return Date.now() - updatedAt > 24 * 60 * 60 * 1000;
}

const AdminBookings = () => {
  const { toast } = useToast();
  const bookingsQuery = useBookings();
  const bookings: any[] = bookingsQuery.data ?? [];
  const loading = bookingsQuery.isLoading;

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(undefined);
  const [selected, setSelected] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const updateBookingStatus = useUpdateBookingStatus();
  const addBookingUpdate = useAddBookingUpdate();
  const rescheduleBooking = useRescheduleBooking();
  const updateBookingInfo = useUpdateBookingInfo();
  const bulkUpdate = useBulkUpdateStatus();

  // Filtered bookings
  const filtered = useMemo(() => {
    let list = bookings;
    if (statusFilter !== "all") list = list.filter((b) => b.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
        b.patient_name?.toLowerCase().includes(q) ||
        b.phone?.includes(q) ||
        b.patient_id?.toLowerCase().includes(q)
      );
    }
    if (calendarDate && viewMode === "calendar") {
      const dateStr = calendarDate.toISOString().slice(0, 10);
      list = list.filter((b) => b.preferred_date === dateStr);
    }
    return list;
  }, [bookings, statusFilter, search, calendarDate, viewMode]);

  // Calendar day counts
  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((b) => {
      if (b.preferred_date) counts[b.preferred_date] = (counts[b.preferred_date] || 0) + 1;
    });
    return counts;
  }, [bookings]);

  // Clear selection when filters change
  const handleFilterChange = useCallback((v: string) => {
    setStatusFilter(v);
    setSelectedIds(new Set());
  }, []);

  const updateStatus = async (id: string, status: string, reason?: string) => {
    try {
      await updateBookingStatus.mutateAsync({ id, status, reason } as any);
      toast({ title: `Status updated to ${statusLabels[status]}` });
      if (selected?.id === id) setSelected({ ...selected, status });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleBulkUpdate = async (status: string) => {
    if (!selectedIds.size) return;
    try {
      await bulkUpdate.mutateAsync({ ids: [...selectedIds], status });
      toast({ title: `${selectedIds.size} booking(s) updated to ${statusLabels[status]}` });
      setSelectedIds(new Set());
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((b) => b.id)));
    }
  };

  const overdueCount = useMemo(() => bookings.filter(isOverdue).length, [bookings]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Bookings</h1>
          {overdueCount > 0 && (
            <p className="text-sm text-destructive flex items-center gap-1 mt-1">
              <AlertTriangle className="h-4 w-4" /> {overdueCount} overdue booking(s) need attention
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => { setViewMode("list"); setCalendarDate(undefined); }}
          >
            <List className="h-4 w-4 mr-1" /> List
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <CalendarCheck className="h-4 w-4 mr-1" /> Calendar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Tabs value={statusFilter} onValueChange={handleFilterChange} className="overflow-x-auto">
          <TabsList className="h-8">
            {STATUSES.map((s) => (
              <TabsTrigger key={s} value={s} className="text-xs px-3 py-1">
                {s === "all" ? "All" : statusLabels[s]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Input
          placeholder="Search name, phone, patient ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-full sm:w-64"
        />
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onUpdate={handleBulkUpdate}
          onClear={() => setSelectedIds(new Set())}
          isPending={bulkUpdate.isPending}
        />
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <Calendar
              mode="single"
              selected={calendarDate}
              onSelect={setCalendarDate}
              modifiers={{
                hasBookings: (date) => {
                  const ds = date.toISOString().slice(0, 10);
                  return (dayCounts[ds] || 0) > 0;
                },
              }}
              modifiersStyles={{
                hasBookings: { fontWeight: "bold", textDecoration: "underline" },
              }}
            />
            {calendarDate && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {dayCounts[calendarDate.toISOString().slice(0, 10)] || 0} booking(s) on {calendarDate.toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex-1">
            <BookingTable
              bookings={filtered}
              loading={loading}
              onSelect={setSelected}
              onStatusChange={updateStatus}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
            />
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <BookingTable
          bookings={filtered}
          loading={loading}
          onSelect={setSelected}
          onStatusChange={updateStatus}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      )}

      {/* Detail Dialog */}
      <BookingDetailDialog
        booking={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onStatusChange={updateStatus}
        addBookingUpdate={addBookingUpdate}
        rescheduleBooking={rescheduleBooking}
        updateBookingInfo={updateBookingInfo}
      />
    </div>
  );
};

// ── Bulk Action Bar ──
function BulkActionBar({
  count,
  onUpdate,
  onClear,
  isPending,
}: {
  count: number;
  onUpdate: (status: string) => void;
  onClear: () => void;
  isPending: boolean;
}) {
  const [bulkStatus, setBulkStatus] = useState("");

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
      <CheckSquare className="h-4 w-4 text-primary shrink-0" />
      <span className="text-sm font-medium text-foreground">{count} selected</span>
      <Select value={bulkStatus} onValueChange={setBulkStatus}>
        <SelectTrigger className="h-8 w-[160px]">
          <SelectValue placeholder="Change status to..." />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(statusLabels).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        onClick={() => { if (bulkStatus) onUpdate(bulkStatus); }}
        disabled={!bulkStatus || isPending}
      >
        Update
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear}>Clear</Button>
    </div>
  );
}

// ── Booking Table ──
function BookingTable({
  bookings,
  loading,
  onSelect,
  onStatusChange,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  bookings: any[];
  loading: boolean;
  onSelect: (b: any) => void;
  onStatusChange: (id: string, status: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}) {
  const allSelected = bookings.length > 0 && selectedIds.size === bookings.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < bookings.length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-3 w-10">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) (el as any).indeterminate = someSelected;
                }}
                onCheckedChange={onToggleSelectAll}
              />
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Patient</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Phone</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Patient ID</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Time</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
            const overdue = isOverdue(b);
            const isSelected = selectedIds.has(b.id);
            return (
              <tr
                key={b.id}
                className={`border-t border-border cursor-pointer hover:bg-muted/30 ${overdue ? "bg-destructive/5" : ""} ${isSelected ? "bg-primary/5" : ""}`}
                onClick={() => onSelect(b)}
              >
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(b.id)}
                  />
                </td>
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  {overdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                  {b.patient_name}
                </td>
                <td className="px-4 py-3">{b.phone}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.patient_id || "—"}</td>
                <td className="px-4 py-3">{b.preferred_date}</td>
                <td className="px-4 py-3">{b.preferred_time}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[b.status] || ""}`}>
                    {statusLabels[b.status] || b.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <Select value={b.status} onValueChange={(v) => onStatusChange(b.id, v)}>
                    <SelectTrigger className="h-8 w-[140px] inline-flex"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {loading && <p className="p-6 text-center text-muted-foreground">Loading...</p>}
      {!loading && !bookings.length && <p className="p-6 text-center text-muted-foreground">No bookings found.</p>}
    </div>
  );
}

// ── Booking Detail Dialog ──
function BookingDetailDialog({
  booking,
  open,
  onClose,
  onStatusChange,
  addBookingUpdate,
  rescheduleBooking,
  updateBookingInfo,
}: {
  booking: any;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: string, reason?: string) => void;
  addBookingUpdate: any;
  rescheduleBooking: any;
  updateBookingInfo: any;
}) {
  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {booking.patient_name}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" /> {booking.phone}
            <span className="mx-1">·</span>
            <Clock className="h-3.5 w-3.5" /> {booking.preferred_date} {booking.preferred_time}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[booking.status]}`}>
              {statusLabels[booking.status]}
            </span>
            {booking.patient_id && (
              <Badge variant="outline" className="text-xs">ID: {booking.patient_id}</Badge>
            )}
            {booking.booking_source && booking.booking_source !== "website" && (
              <Badge variant="secondary" className="text-xs">{booking.booking_source}</Badge>
            )}
          </div>
        </DialogHeader>

        <Accordion type="multiple" defaultValue={["timeline"]} className="mt-4">
          {/* Patient Info */}
          <AccordionItem value="info">
            <AccordionTrigger className="text-sm">Patient Info</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm">
                {booking.email && <div><strong>Email:</strong> {booking.email}</div>}
                {booking.address && <div><strong>Address:</strong> {booking.address}</div>}
                {booking.selected_tests?.length > 0 && (
                  <div><strong>Tests:</strong> {booking.selected_tests.join(", ")}</div>
                )}
                {booking.selected_package && <div><strong>Package:</strong> {booking.selected_package}</div>}
                {booking.extra_phones?.length > 0 && (
                  <div><strong>Extra Phones:</strong> {booking.extra_phones.join(", ")}</div>
                )}
                {booking.notes && <div><strong>Notes:</strong> {booking.notes}</div>}
                <div><strong>Source:</strong> {booking.booking_source || "website"}</div>
                <div><strong>Created:</strong> {new Date(booking.created_at).toLocaleString()}</div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Patient History */}
          <AccordionItem value="history">
            <AccordionTrigger className="text-sm">Patient History</AccordionTrigger>
            <AccordionContent>
              <PatientHistorySection phone={booking.phone} name={booking.patient_name} currentId={booking.id} />
            </AccordionContent>
          </AccordionItem>

          {/* Timeline */}
          <AccordionItem value="timeline">
            <AccordionTrigger className="text-sm">Timeline</AccordionTrigger>
            <AccordionContent>
              <TimelineSection bookingId={booking.id} />
            </AccordionContent>
          </AccordionItem>

          {/* Add Update */}
          <AccordionItem value="add-update">
            <AccordionTrigger className="text-sm">Add Update</AccordionTrigger>
            <AccordionContent>
              <AddUpdateForm bookingId={booking.id} mutation={addBookingUpdate} />
            </AccordionContent>
          </AccordionItem>

          {/* Edit Booking Info */}
          <AccordionItem value="edit-info">
            <AccordionTrigger className="text-sm">Edit Booking Info</AccordionTrigger>
            <AccordionContent>
              <EditInfoForm booking={booking} mutation={updateBookingInfo} onClose={onClose} />
            </AccordionContent>
          </AccordionItem>

          {/* Change Status */}
          <AccordionItem value="status">
            <AccordionTrigger className="text-sm">Change Status</AccordionTrigger>
            <AccordionContent>
              <ChangeStatusSection booking={booking} onStatusChange={onStatusChange} />
            </AccordionContent>
          </AccordionItem>

          {/* Reschedule */}
          <AccordionItem value="reschedule">
            <AccordionTrigger className="text-sm">Reschedule</AccordionTrigger>
            <AccordionContent>
              <RescheduleForm booking={booking} mutation={rescheduleBooking} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}

// ── Change Status Section (with downgrade reason) ──
function ChangeStatusSection({
  booking,
  onStatusChange,
}: {
  booking: any;
  onStatusChange: (id: string, status: string, reason?: string) => void;
}) {
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const currentRank = STATUS_RANK[booking.status] ?? 0;

  const handleClick = (newStatus: string) => {
    const newRank = STATUS_RANK[newStatus] ?? 0;
    if (newRank < currentRank) {
      setPendingStatus(newStatus);
      setReason("");
    } else {
      onStatusChange(booking.id, newStatus);
    }
  };

  const confirmDowngrade = () => {
    if (!reason.trim()) return;
    if (pendingStatus) {
      onStatusChange(booking.id, pendingStatus, reason);
      setPendingStatus(null);
      setReason("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusLabels).map(([k, v]) => (
          <Button
            key={k}
            size="sm"
            variant={booking.status === k ? "default" : "outline"}
            onClick={() => handleClick(k)}
            disabled={booking.status === k}
            className="text-xs"
          >
            {v}
          </Button>
        ))}
      </div>
      {pendingStatus && (
        <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm text-destructive font-medium">
            Downgrading from {statusLabels[booking.status]} → {statusLabels[pendingStatus]}
          </p>
          <Textarea
            placeholder="Reason for status downgrade (required)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={confirmDowngrade} disabled={!reason.trim()}>
              Confirm
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPendingStatus(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Timeline Section ──
function TimelineSection({ bookingId }: { bookingId: string }) {
  const { data: updates, isLoading } = useBookingUpdates(bookingId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading timeline...</p>;
  if (!updates?.length) return <p className="text-sm text-muted-foreground">No updates yet.</p>;

  return (
    <div className="space-y-3">
      {(updates as any[]).map((u: any) => (
        <div key={u.id} className="flex gap-3 text-sm">
          <div className="flex flex-col items-center">
            <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
            <div className="flex-1 w-px bg-border" />
          </div>
          <div className="pb-3 flex-1">
            <p className="font-medium text-foreground">
              {u.update_type === "other" && u.new_value
                ? u.new_value
                : updateTypeLabels[u.update_type] || u.update_type}
              {u.update_type === "status_change" && u.old_value && u.new_value && (
                <span className="font-normal text-muted-foreground">
                  {" "}— {statusLabels[u.old_value] || u.old_value} → {statusLabels[u.new_value] || u.new_value}
                </span>
              )}
              {u.update_type === "date_change" && u.old_value && u.new_value && (
                <span className="font-normal text-muted-foreground"> — {u.old_value} → {u.new_value}</span>
              )}
              {u.update_type !== "status_change" && u.update_type !== "date_change" && u.update_type !== "other" && !u.old_value && u.new_value && (
                <span className="font-normal text-muted-foreground"> — {u.new_value}</span>
              )}
            </p>
            {u.note && <p className="text-muted-foreground">{u.note}</p>}
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(u.created_at).toLocaleString()}
              {u.actor_name && <span> · {u.actor_name}</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Patient History Section (with expandable timelines) ──
function PatientHistorySection({ phone, name, currentId }: { phone: string; name: string; currentId: string }) {
  const { data: history, isLoading } = usePatientHistory(phone, name);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading history...</p>;
  const past = ((history as any[]) ?? []).filter((b: any) => b.id !== currentId);
  if (!past.length) return <p className="text-sm text-muted-foreground">No previous bookings found.</p>;

  return (
    <Accordion type="multiple" className="space-y-1">
      {past.map((b: any) => (
        <AccordionItem key={b.id} value={b.id} className="border rounded-lg px-3">
          <AccordionTrigger className="py-2 text-sm hover:no-underline">
            <div className="flex items-center justify-between w-full mr-2">
              <div className="text-left">
                <p className="font-medium">{b.patient_name}</p>
                <p className="text-xs text-muted-foreground">{b.preferred_date} · {b.preferred_time}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[b.status] || ""}`}>
                {statusLabels[b.status] || b.status}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <TimelineSection bookingId={b.id} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

// ── Add Update Form ──
function AddUpdateForm({ bookingId, mutation }: { bookingId: string; mutation: any }) {
  const { toast } = useToast();
  const [updateType, setUpdateType] = useState("follow_up_call");
  const [note, setNote] = useState("");
  const [customTitle, setCustomTitle] = useState("Other");

  const submit = async () => {
    if (!note.trim()) { toast({ title: "Note is required", variant: "destructive" }); return; }
    try {
      const payload: any = { id: bookingId, update_type: updateType, note };
      if (updateType === "other") payload.custom_title = customTitle || "Other";
      await mutation.mutateAsync(payload);
      setNote("");
      setCustomTitle("Other");
      toast({ title: "Update added" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <Select value={updateType} onValueChange={setUpdateType}>
        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="follow_up_call">Follow-up Call</SelectItem>
          <SelectItem value="note">Note</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
      {updateType === "other" && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          <Input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Enter update title"
            className="h-8 mt-1"
          />
        </div>
      )}
      <Textarea placeholder="Add details..." value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      <Button size="sm" onClick={submit} disabled={mutation.isPending}>Submit</Button>
    </div>
  );
}

// ── Edit Info Form ──
function EditInfoForm({ booking, mutation, onClose }: { booking: any; mutation: any; onClose: () => void }) {
  const { toast } = useToast();
  const [patientId, setPatientId] = useState(booking.patient_id || "");
  const [extraPhones, setExtraPhones] = useState<string[]>(booking.extra_phones || []);
  const [notes, setNotes] = useState(booking.notes || "");
  const [newPhone, setNewPhone] = useState("");

  const addPhone = () => {
    if (newPhone.trim()) {
      setExtraPhones([...extraPhones, newPhone.trim()]);
      setNewPhone("");
    }
  };

  const removePhone = (i: number) => {
    setExtraPhones(extraPhones.filter((_, idx) => idx !== i));
  };

  const save = async () => {
    try {
      await mutation.mutateAsync({
        id: booking.id,
        patient_id: patientId || null,
        extra_phones: extraPhones,
        notes,
      });
      toast({ title: "Booking info updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Patient ID</label>
        <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="e.g. LAB-001" className="h-8 mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Extra Phone Numbers</label>
        <div className="flex flex-wrap gap-1 mt-1">
          {extraPhones.map((p, i) => (
            <Badge key={i} variant="secondary" className="text-xs gap-1">
              {p}
              <button onClick={() => removePhone(i)}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 mt-1">
          <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+91..." className="h-8 flex-1" />
          <Button size="sm" variant="outline" onClick={addPhone} className="h-8">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Notes</label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1" />
      </div>
      <Button size="sm" onClick={save} disabled={mutation.isPending}>Save</Button>
    </div>
  );
}

// ── Reschedule Form ──
function RescheduleForm({ booking, mutation }: { booking: any; mutation: any }) {
  const { toast } = useToast();
  const [date, setDate] = useState(booking.preferred_date || "");
  const [time, setTime] = useState(booking.preferred_time || "");
  const [reason, setReason] = useState("");

  // Time slots from 06:00 to 18:30
  const slots: string[] = [];
  for (let h = 6; h <= 18; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    if (h < 18) {
      slots.push(`${h.toString().padStart(2, "0")}:30`);
    } else {
      slots.push("18:30");
    }
  }

  const submit = async () => {
    if (!date && !time) { toast({ title: "Select date or time", variant: "destructive" }); return; }
    try {
      await mutation.mutateAsync({ id: booking.id, preferred_date: date, preferred_time: time, reason: reason || undefined });
      toast({ title: "Booking rescheduled" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Date</label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Time Slot</label>
        <Select value={time} onValueChange={setTime}>
          <SelectTrigger className="h-8 mt-1"><SelectValue placeholder="Select time" /></SelectTrigger>
          <SelectContent>
            {slots.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Reason for Reschedule</label>
        <Textarea
          placeholder="Why is this being rescheduled? (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="mt-1"
        />
      </div>
      <Button size="sm" onClick={submit} disabled={mutation.isPending}>Update Schedule</Button>
    </div>
  );
}

export default AdminBookings;
