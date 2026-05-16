import type { Query } from "@tanstack/react-query";
import useSupabaseQuery from "./useSupabaseQuery";
import useSupabaseMutation from "./useSupabaseMutation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { announcementRowSchema, type Announcement } from "@/lib/announcements";

function isApiRouteNotFound(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const maybe = err as Error & { status?: number };
  return maybe.status === 404 || err.message.toLowerCase().includes("not found");
}

function isApiUnavailable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const maybe = err as Error & { status?: number };
  const msg = err.message.toLowerCase();
  if (maybe.status == null || maybe.status === 0) {
    return msg.includes("failed to fetch") || msg.includes("network") || msg.includes("load failed");
  }
  return maybe.status >= 500;
}

function shouldFallbackPublicReadToDb(err: unknown): boolean {
  return isApiRouteNotFound(err) || isApiUnavailable(err);
}

/** Public feed only — mirrors edge list filters (RLS also restricts anon reads). */
async function listAnnouncementsViaDb(): Promise<Announcement[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .is("deleted_at", null)
    .eq("is_active", true)
    .or(`start_at.is.null,start_at.lte.${nowIso}`)
    .or(`end_at.is.null,end_at.gte.${nowIso}`)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => {
      const parsed = announcementRowSchema.safeParse(row);
      return parsed.success ? parsed.data : null;
    })
    .filter((x): x is Announcement => x !== null);
}

/**
 * Public announcement feed. Server returns rows already filtered by absolute
 * window + is_active; client further filters by page/device/audience/time_window
 * inside AnnouncementProvider.
 *
 * When any row is critical, refetch periodically so urgent edits propagate without
 * waiting for focus or mount.
 */
export function useAnnouncements(opts?: { enabled?: boolean }) {
  return useSupabaseQuery<Announcement[]>(
    ["announcements", "public"],
    async () => {
      try {
        const data = await api.get<unknown[]>("/announcements");
        return (data ?? [])
          .map((row) => {
            const parsed = announcementRowSchema.safeParse(row);
            return parsed.success ? parsed.data : null;
          })
          .filter((x): x is Announcement => x !== null);
      } catch (err) {
        if (!shouldFallbackPublicReadToDb(err)) throw err;
        return listAnnouncementsViaDb();
      }
    },
    {
      enabled: opts?.enabled ?? true,
      staleTime: 60 * 1000,
      refetchInterval: (query: Query<Announcement[], Error>) => {
        const rows = query.state.data;
        if (!rows?.some((a) => a.severity === "critical")) return false;
        return 20_000;
      },
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  );
}

/**
 * Admin: include inactive/scheduled-future rows. Edge API only (service role + role checks).
 *
 * Pass `status` to scope to a single lifecycle bucket (draft/scheduled/live/paused/expired/archived).
 * Default returns everything (including archived) so the admin UI can filter and
 * count all lifecycle buckets in-memory without re-fetching per chip click.
 */
export function useAdminAnnouncements(status?: string) {
  const key = status ?? "all";
  return useSupabaseQuery<Announcement[]>(
    ["announcements", "admin", key],
    async () => {
      const qs = status
        ? `?status=${encodeURIComponent(status)}`
        : "?all=1&include_archived=1";
      const data = await api.get<unknown[]>(`/announcements${qs}`);
      return (data ?? [])
        .map((row) => {
          const parsed = announcementRowSchema.safeParse(row);
          return parsed.success ? parsed.data : null;
        })
        .filter((x): x is Announcement => x !== null);
    },
    { staleTime: 30 * 1000 },
  );
}

export function useAnnouncement(id: string | undefined) {
  return useSupabaseQuery<Announcement | null>(
    ["announcement", id],
    async () => {
      if (!id) return null;
      const data = await api.get(`/announcements/${id}`);
      const parsed = announcementRowSchema.safeParse(data);
      return parsed.success ? parsed.data : null;
    },
    { enabled: Boolean(id) },
  );
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useSupabaseMutation(
    async (body: Partial<Announcement>) => {
      return await api.post("/announcements", body);
    },
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["announcements"] });
      },
    },
  );
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useSupabaseMutation(
    async ({ id, body }: { id: string; body: Partial<Announcement> }) => {
      return await api.put(`/announcements/${id}`, body);
    },
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["announcements"] });
      },
    },
  );
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useSupabaseMutation(
    async (id: string) => {
      return await api.del(`/announcements/${id}`);
    },
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["announcements"] });
      },
    },
  );
}

// ── Lifecycle verbs ─────────────────────────────────────────────────────────

export function useCloneAnnouncement() {
  const qc = useQueryClient();
  return useSupabaseMutation(
    async (id: string) => {
      return await api.post<Announcement>(`/announcements/${id}/clone`, {});
    },
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["announcements"] });
      },
    },
  );
}

export function usePauseAnnouncement() {
  const qc = useQueryClient();
  return useSupabaseMutation(
    async (id: string) => {
      return await api.post<Announcement>(`/announcements/${id}/pause`, {});
    },
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["announcements"] });
      },
    },
  );
}

export function usePublishAnnouncement() {
  const qc = useQueryClient();
  return useSupabaseMutation(
    async (id: string) => {
      return await api.post<Announcement>(`/announcements/${id}/publish`, {});
    },
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["announcements"] });
      },
    },
  );
}

export function useRestoreAnnouncement() {
  const qc = useQueryClient();
  return useSupabaseMutation(
    async (id: string) => {
      return await api.post<Announcement>(`/announcements/${id}/restore`, {});
    },
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["announcements"] });
      },
    },
  );
}

export type AnnouncementBulkAction = "pause" | "publish" | "archive" | "restore";

export function useBulkAnnouncementAction() {
  const qc = useQueryClient();
  return useSupabaseMutation(
    async ({ ids, action }: { ids: string[]; action: AnnouncementBulkAction }) => {
      return await api.post<{ success: boolean; affected: number }>(
        "/announcements/bulk",
        { ids, action },
      );
    },
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["announcements"] });
      },
    },
  );
}
