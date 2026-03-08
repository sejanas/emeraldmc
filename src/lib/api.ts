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

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options?.method ?? "GET",
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
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

export async function getPackages() {
  return request<any>(`/packages`);
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
