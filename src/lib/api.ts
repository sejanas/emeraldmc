import { supabase } from "@/integrations/supabase/client";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL ?? "https://kswypwqxxhsbnrhnqrzm.supabase.co"}/functions/v1/api`;

// Module-level token cache — updated by the auth listener so reads are instant
// (no Web Lock, no async delay) on every API request.
let _cachedToken: string | null = null;

supabase.auth.onAuthStateChange((_event, session) => {
  _cachedToken = session?.access_token ?? null;
});

// Prime the cache from localStorage session without blocking request callers.
supabase.auth.getSession().then(({ data }) => {
  _cachedToken = data.session?.access_token ?? null;
});

function getToken(): string | null {
  return _cachedToken;
}

async function request<T = any>(
  path: string,
  options?: { method?: string; body?: any }
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const method = options?.method ?? "GET";
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Failed to fetch";
    const err = new Error(`Network error during ${method} ${path}: ${message}`) as Error & {
      status?: number;
      safeMessage?: string;
      details?: string;
      path?: string;
      method?: string;
      data?: unknown;
      cause?: unknown;
    };
    err.status = 0;
    err.safeMessage = "Unable to connect right now. Please check your internet connection and try again.";
    err.path = path;
    err.method = method;
    err.details = "Could not reach edge function";
    err.cause = cause;
    throw err;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (typeof data?.error === "string" && data.error) ||
      (typeof data?.message === "string" && data.message) ||
      res.statusText ||
      "Request failed";
    const err = new Error(message) as Error & {
      status?: number;
      safeMessage?: string;
      details?: string;
      path?: string;
      data?: unknown;
    };
    err.status = res.status;
    err.safeMessage =
      res.status === 401 || res.status === 403
        ? "You are not authorized to perform this action."
        : res.status === 404
          ? "The requested resource was not found."
          : res.status === 429
            ? "Too many requests. Please wait a moment and try again."
            : res.status >= 500
              ? "Server error. Please try again shortly."
              : "We couldn't process your request right now. Please try again.";
    err.path = path;
    err.data = data;
    if (typeof data?.details === "string") err.details = data.details;
    throw err;
  }
  return data as T;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "POST", body }),
  put: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "PUT", body }),
  del: <T = any>(path: string) => request<T>(path, { method: "DELETE" }),
};

// Convenience methods for common resources. Prefer these in hooks/components.
export async function getTests(params?: Record<string, string | number | boolean>) {
  const qs = params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}` : "";
  return request<any>(`/tests${qs}`);
}

export async function createTest(body: any) {
  return request<any>(`/tests`, { method: "POST", body });
}

export async function updateTest(id: string, body: any) {
  return request<any>(`/tests/${id}`, { method: "PUT", body });
}

export async function deleteTest(id: string) {
  return request<any>(`/tests/${id}`, { method: "DELETE" });
}

export async function getSubTests(testId: string) {
  return request<any>(`/sub-tests?test_id=${testId}`);
}

export async function createSubTest(body: any) {
  return request<any>(`/sub-tests`, { method: "POST", body });
}

export async function updateSubTest(id: string, body: any) {
  return request<any>(`/sub-tests/${id}`, { method: "PUT", body });
}

export async function deleteSubTest(id: string) {
  return request<any>(`/sub-tests/${id}`, { method: "DELETE" });
}

export async function getPackages(includeInactive = false) {
  return request<any>(`/packages${includeInactive ? '?active=false' : ''}`);
}

export async function createPackage(body: any) {
  return request<any>(`/packages`, { method: "POST", body });
}

export async function updatePackage(id: string, body: any) {
  return request<any>(`/packages/${id}`, { method: "PUT", body });
}

export async function deletePackage(id: string) {
  return request<any>(`/packages/${id}`, { method: "DELETE" });
}

export async function reorderItem(table: string, id: string, direction: "up" | "down") {
  return request<any>(`/reorder`, { method: "POST", body: { table, id, direction } });
}
