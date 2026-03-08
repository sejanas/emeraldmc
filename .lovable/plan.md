

# Enhanced Booking System — Updated Plan

## Summary

Add `booking_manager` role (default for all signups), a `booking_updates` timeline table, patient history, calendar view, overdue alerts, and booking manager capabilities to add extra phone numbers, notes, and link patients with a patient ID.

---

## 1. Database Migration

### a) Add `booking_manager` to enum
```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'booking_manager';
```

### b) Add columns to `bookings`
- `confirmed_at timestamptz`
- `sample_collected_at timestamptz`
- `completed_at timestamptz`
- `cancelled_at timestamptz`
- `booking_source text DEFAULT 'website'`
- `assigned_to uuid`
- `patient_id text` — lab-generated patient ID for linking
- `extra_phones text[]` — additional contact numbers added by booking manager

### c) Create `booking_updates` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| booking_id | uuid FK → bookings.id | ON DELETE CASCADE |
| update_type | text NOT NULL | `status_change`, `follow_up_call`, `note`, `date_change`, `info_update`, `other` |
| old_value | text | previous value |
| new_value | text | new value |
| note | text | free text |
| created_by | uuid | staff user id |
| created_at | timestamptz | default now() |

### d) RLS policies
- `booking_updates`: SELECT/INSERT for `admin` and `booking_manager` roles
- `bookings`: Update existing RLS to also allow `booking_manager` for SELECT/UPDATE
- Use `has_role` function (works automatically once enum value is added)

---

## 2. Backend (Edge Function)

### Auth changes
- **Signup**: Default role → `booking_manager` (change lines 179 and 193)
- **handlePromoteUser**: Accept `target_role` parameter instead of hardcoding `super_admin`. Validate target is one of `booking_manager`, `admin`, `super_admin`

### Booking endpoint access
- All booking routes: allow `["admin", "super_admin", "booking_manager"]`
- All other CRUD (tests, categories, doctors, etc.): keep `["admin", "super_admin"]`

### New endpoints
- **`POST /bookings/:id/updates`** — Add timeline entry. Accepts `{ update_type, note, status?, preferred_date?, preferred_time?, patient_id?, extra_phones? }`. Handles:
  - `status_change`: update booking status + set timestamp + timeline entry
  - `follow_up_call`: timeline entry with note (e.g. "No answer", "Confirmed")
  - `date_change`: update booking date/time + timeline entry with old/new
  - `info_update`: update patient_id, extra_phones, notes on booking + timeline entry
  - `note`: plain note entry

- **`GET /bookings/:id/updates`** — Timeline entries ordered by `created_at ASC`, enriched with actor name

- **`GET /bookings/patient-history?phone=X&name=Y`** — Past bookings by phone OR patient_id, optionally filtered by name

- **`PUT /bookings/:id/reschedule`** — Change date/time, creates `date_change` timeline entry

- **`PUT /bookings/:id/info`** — Update patient_id, extra_phones, notes fields on booking

### Auto-insert
- When booking is created via `handleBookingCreate`, also insert initial `booking_updates` row (type: `status_change`, new_value: `pending`)

---

## 3. Frontend — Auth & Routing

### `useAuth.tsx`
- Add `isBookingManager`: `profile?.role === 'booking_manager'`
- Update `isAdmin`: `['admin', 'super_admin', 'booking_manager'].includes(profile?.role)`

### `AdminRoute.tsx`
- Allow `booking_manager` but restrict to `/admin/bookings` and `/admin/profile` only

### `AdminLayout.tsx`
- Filter sidebar by role:
  - `booking_manager`: Bookings + My Profile
  - `admin`: Everything except Users/Theme
  - `super_admin`: Everything

### `AdminUsers.tsx`
- Replace "Promote to Super Admin" with a role dropdown: `booking_manager` ↔ `admin` ↔ `super_admin`

### `AdminSignup.tsx`
- No role selector needed — all signups default to `booking_manager`

---

## 4. Frontend — Redesigned AdminBookings

### List View
- **Filter tabs**: All | Pending | Confirmed | Sample Collected | Completed | Cancelled
- **Search**: by patient name, phone, or patient ID
- **Overdue indicator**: Red badge on pending/confirmed bookings with no `booking_updates` in 24 hours
- **Toggle**: List view ↔ Calendar/daily summary view (using `react-day-picker` with count badges per day)

### Booking Detail (Sheet panel)
Opens on row click. Accordion sections:

```text
+------------------------------------------+
| Patient Name · Phone · [Status Badge]    |
| Date · Time · Patient ID: LAB-001        |
+------------------------------------------+
| > Patient Info                           |
|   Email, Address, Tests, Package,        |
|   Extra Phones, Source                   |
|                                          |
| > Patient History  (N past bookings)     |
|   Fetched by phone+name from API         |
|                                          |
| v Timeline                               |
|   * Created — Mar 8, 2:30 PM            |
|   * Confirmed — Mar 8, 3:00 PM — Ash    |
|   * Follow-up — No answer — 3:15 PM     |
|   * Patient ID linked: LAB-001 — 3:20   |
|   * Extra phone added: +91... — 3:25    |
|   * Rescheduled 10→12 — 4:00 PM         |
|                                          |
| > Add Update                             |
|   Type: [Follow-up Call v]               |
|   Note: [________________]              |
|   [Submit]                               |
|                                          |
| > Edit Booking Info                      |
|   Patient ID: [LAB-___]                  |
|   Extra Phones: [+91...] [+ Add]         |
|   Notes: [________________]              |
|   [Save]                                 |
|                                          |
| > Change Status                          |
|   Status pills as buttons                |
|                                          |
| > Reschedule                             |
|   Date: [____] Time: [____]              |
|   [Update Schedule]                      |
+------------------------------------------+
```

---

## 5. New Hooks
- `useBookingUpdates(bookingId)` — fetch timeline
- `useAddBookingUpdate()` — add timeline entry
- `usePatientHistory(phone, name)` — past bookings
- `useRescheduleBooking()` — change date/time
- `useUpdateBookingInfo()` — update patient_id, extra_phones, notes

---

## 6. All Gaps Addressed

| Gap | Solution |
|-----|----------|
| No audit trail | `booking_updates` timeline |
| No patient history | Lookup by phone+name |
| No follow-up tracking | `follow_up_call` update type |
| Booking managers have full access | Role-restricted routing + backend |
| Can't reschedule | Reschedule endpoint + UI |
| No overdue visibility | 24-hour highlight |
| No calendar view | Daily summary toggle |
| All signups default to admin | Default to `booking_manager` |
| Promote only to super_admin | Flexible target_role |
| No booking source tracking | `booking_source` column |
| No staff assignment | `assigned_to` column |
| No initial timeline entry | Auto-create on booking |
| No patient ID linking | `patient_id` column + edit UI |
| No extra phone numbers | `extra_phones` array + edit UI |
| No inline notes editing | Edit Booking Info accordion |

---

## Implementation Order

1. Database migration (enum + `booking_updates` table + new columns on bookings + RLS)
2. Edge function (new endpoints, role changes, signup default, promote flexibility)
3. Frontend auth/routing (useAuth, AdminRoute, AdminLayout, AdminUsers)
4. Frontend AdminBookings full rebuild (list, filters, calendar, detail sheet, timeline, patient history, edit info)
5. New hooks

