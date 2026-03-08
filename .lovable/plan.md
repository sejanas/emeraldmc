

## Visitor Analytics: Location Tracking + Admin Page

### Database Migration
Add `city`, `region`, `country` columns to `visitors` table.

### Backend Changes (`supabase/functions/api/index.ts`)

1. **`POST /visitors/track`**: After dedup check, extract IP from `x-forwarded-for` header, call `https://ipapi.co/{ip}/json/` for geolocation, store `city`, `region`, `country` on insert. Graceful fallback to nulls on failure.

2. **New endpoints** (admin-only):
   - `GET /visitors/analytics` — paginated raw visitor rows with filters: `from`, `to` (date range), `page`, `country`, `region`, `city`. Ordered by `visited_at` desc.
   - `GET /visitors/locations` — aggregated counts grouped by `country, region, city`, with optional `from`/`to` date filter. Sorted by count desc.
   - `GET /visitors/daily` — daily visit counts for charting, with optional `from`/`to` and `country`/`page` filters.

3. **Dashboard counts**: Add `visitors_today` to the dashboard counts endpoint.

### Frontend — New Admin Visitors Page (`src/pages/admin/AdminVisitors.tsx`)

Tabbed page with 3 views:

| Tab | Content |
|---|---|
| **Trends** | Area chart (recharts) of daily visits. Filters: date range (7d/30d/90d), country, page path. |
| **Locations** | Table: country, region, city, visit count. Filters: date range, country dropdown. |
| **Log** | Paginated table: page, city/region/country, visited_at, user_agent, referrer. Filters: date range, country, city, page. |

Available filter dimensions based on existing data:
- **Date range**: 7d / 30d / 90d / All time (presets)
- **Country**: dropdown populated from distinct values
- **Region**: dropdown, dependent on selected country
- **City**: dropdown, dependent on selected region
- **Page path**: dropdown from distinct `page` values

### Dashboard Enhancement (`AdminDashboard.tsx`)
- Add "Today's Visitors" card
- Add a mini "Top 5 Locations" list below the stats grid

### New Files
- `src/pages/admin/AdminVisitors.tsx` — full analytics page
- `src/hooks/useVisitors.ts` — hooks for the 3 endpoints

### Updated Files
- `supabase/functions/api/index.ts` — new endpoints + geolocation on track
- `src/pages/admin/AdminDashboard.tsx` — today's visitors + top locations
- `src/pages/admin/AdminLayout.tsx` — add Visitors nav link
- `src/App.tsx` — add `/admin/visitors` route

