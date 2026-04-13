import useSupabaseQuery from "./useSupabaseQuery";
import { useSupabaseMutation } from "./useSupabaseMutation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface VisitorLog {
  id: string;
  page: string;
  visited_at: string;
  referrer: string | null;
  user_agent: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
}

interface LocationAgg {
  country: string;
  region: string;
  city: string;
  count: number;
}

interface DailyCount {
  date: string;
  count: number;
}

interface FilterOptions {
  countries: string[];
  regions: string[];
  cities: string[];
  pages: string[];
}

interface DeviceBreakdown {
  browsers: { name: string; count: number }[];
  os: { name: string; count: number }[];
}

interface BounceData {
  total_visitors: number;
  bounced: number;
  bounce_rate: number;
}

interface LiveCount {
  count: number;
  minutes: number;
}

function buildQs(params: Record<string, string | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => v);
  return entries.length ? "?" + new URLSearchParams(entries as [string, string][]).toString() : "";
}

export function useVisitorAnalytics(filters: {
  from?: string;
  to?: string;
  page?: string;
  country?: string;
  region?: string;
  city?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = buildQs({
    from: filters.from,
    to: filters.to,
    page: filters.page,
    country: filters.country,
    region: filters.region,
    city: filters.city,
    limit: String(filters.limit ?? 50),
    offset: String(filters.offset ?? 0),
  });
  return useSupabaseQuery<{ data: VisitorLog[]; total: number | null }>(
    ["visitors", "analytics", qs],
    () => api.get(`/visitors/analytics${qs}`),
    { refetchOnMount: true }
  );
}

export function useVisitorLocations(filters: {
  from?: string;
  to?: string;
  country?: string;
}) {
  const qs = buildQs({ from: filters.from, to: filters.to, country: filters.country });
  return useSupabaseQuery<LocationAgg[]>(
    ["visitors", "locations", qs],
    () => api.get(`/visitors/locations${qs}`),
    { refetchOnMount: true }
  );
}

export function useVisitorDaily(filters: {
  from?: string;
  to?: string;
  country?: string;
  page?: string;
}) {
  const qs = buildQs({ from: filters.from, to: filters.to, country: filters.country, page: filters.page });
  return useSupabaseQuery<DailyCount[]>(
    ["visitors", "daily", qs],
    () => api.get(`/visitors/daily${qs}`),
    { refetchOnMount: true }
  );
}

export function useVisitorFilters() {
  return useSupabaseQuery<FilterOptions>(
    ["visitors", "filters"],
    () => api.get("/visitors/filters"),
    { staleTime: 1000 * 60 * 5 }
  );
}

export function useVisitorDevices(filters: { from?: string; to?: string }) {
  const qs = buildQs({ from: filters.from, to: filters.to });
  return useSupabaseQuery<DeviceBreakdown>(
    ["visitors", "devices", qs],
    () => api.get(`/visitors/devices${qs}`),
    { refetchOnMount: true }
  );
}

export function useVisitorBounce(filters: { from?: string; to?: string }) {
  const qs = buildQs({ from: filters.from, to: filters.to });
  return useSupabaseQuery<BounceData>(
    ["visitors", "bounce", qs],
    () => api.get(`/visitors/bounce${qs}`),
    { refetchOnMount: true }
  );
}

export function useVisitorLive(minutes = 60) {
  return useSupabaseQuery<LiveCount>(
    ["visitors", "live", minutes],
    () => api.get(`/visitors/live?minutes=${minutes}`),
    { refetchInterval: 30_000, staleTime: 15_000 }
  );
}

export function useVisitorCleanup() {
  const qc = useQueryClient();
  return useSupabaseMutation<{ success: boolean; deleted: number }, Error, { no_geo?: boolean; before?: string }>(
    (filters) => api.post("/visitors/cleanup", filters),
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["visitors"] });
      },
    }
  );
}
