import { supabase } from "@/integrations/supabase/client";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request<T = any>(
  path: string,
  options?: { method?: string; body?: any }
): Promise<T> {
  const token = await getToken();
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
