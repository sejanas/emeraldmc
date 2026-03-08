

# Booking Enhancements — 8 Changes + Bulk Status Update

All 8 changes to AdminBookings plus bulk status update, implemented across backend and frontend.

---

## 1. Backend Changes (Edge Function)

### a) `handleBookingStatusUpdate` — accept `reason`
- Parse `reason` from request body alongside `status`
- Store `reason` in the `note` column of the `booking_updates` entry
- Include `reason` in activity log changes

### b) `handleBulkStatusUpdate` — new function
- Accepts `{ ids: string[], status: string }`
- Requires `BOOKING_ROLES`
- Loops through each ID: fetches old status, updates booking + timestamp column, inserts `booking_updates` entry per booking
- Logs a single `booking.bulk_status_update` activity

### c) Router — add bulk route
- Add `if (method === "PUT" && id === "bulk-status") return await handleBulkStatusUpdate(req);` in the bookings router block (before individual ID routes)

### d) `handleBookingReschedule` — accept `reason`
- Parse `reason` from body, store in `note` column of the timeline entry

### e) `handleBookingUpdates` POST — accept `custom_title` for "other" type
- When `update_type === "other"`, read `custom_title` from body (default "Other"), store in `new_value`
- Also touch `updated_at` on the booking for overdue tracking

---

## 2. Frontend Hook — `useBulkUpdateStatus`

In `useBookingsMutations.ts`, add:
```typescript
export function useBulkUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      api.put('/bookings/bulk-status', { ids, status }),
    onMutate: async ({ ids, status }) => {
      await qc.cancelQueries({ queryKey: ['bookings'] });
      const prev = qc.getQueryData(['bookings']);
      qc.setQueryData(['bookings'], (old: any) =>
        (old ?? []).map((b: any) => ids.includes(b.id) ? { ...b, status } : b)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(['bookings'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking-updates'] });
    },
  });
}
```

Also update `useUpdateBookingStatus` to accept optional `reason`:
```typescript
mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
  api.put(`/bookings/${id}/status`, { status, reason }),
```

And `useRescheduleBooking` to accept `reason`:
```typescript
mutationFn: ({ id, ...body }: { id: string; preferred_date?: string; preferred_time?: string; reason?: string }) =>
  api.put(`/bookings/${id}/reschedule`, body),
```

---

## 3. AdminBookings.tsx — Full UI Overhaul

### a) Replace Sheet with Dialog
- Import `Dialog, DialogContent, DialogHeader, DialogTitle` instead of `Sheet, SheetContent, SheetHeader, SheetTitle`
- Use `max-w-2xl max-h-[85vh] overflow-y-auto` on DialogContent

### b) Checkbox selection + bulk action bar
- Add `selectedIds: Set<string>` state
- Add checkbox column to table header (select all) and each row
- Floating bar above table when selections exist: `"{N} selected" · status dropdown · "Update" button · "Clear"`
- Clear selection on filter change
- Uses `useBulkUpdateStatus` hook

### c) Status downgrade requires reason
- Define `STATUS_RANK = { cancelled: -1, pending: 0, confirmed: 1, sample_collected: 2, completed: 3 }`
- In Change Status section, clicking a lower-rank status shows a required reason textarea before confirming
- Pass `reason` to `updateBookingStatus.mutateAsync({ id, status, reason })`

### d) "Other" update type shows custom title field
- In AddUpdateForm, when `updateType === "other"`, show an Input for custom title (defaults to "Other")
- Pass `custom_title` in mutation body

### e) Time slots 6:00 AM to 6:30 PM
- Change RescheduleForm slot generation: hours 6-18, always push `h:00` and `h:30`, resulting in 06:00 through 18:30 (26 slots)

### f) Reschedule reason
- Add a Textarea for reason in RescheduleForm
- Pass `reason` in mutation body

### g) Patient history with expandable timelines
- Each past booking in PatientHistorySection becomes an accordion item
- When expanded, renders an inline `TimelineSection` for that booking's ID

---

## Implementation Order
1. Edge function — bulk status handler, reason/custom_title support in existing handlers, router update
2. Hook — `useBulkUpdateStatus`, update existing hooks for reason/custom_title
3. AdminBookings.tsx — complete rewrite with all 8 UI changes

