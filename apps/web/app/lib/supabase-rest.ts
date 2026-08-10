import "server-only";

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: {
    id: string;
    email?: string;
    email_confirmed_at?: string | null;
    user_metadata?: Record<string, unknown>;
  };
};

export type SupabaseUser = SupabaseSession["user"];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(url && anonKey);

function requireConfig() {
  if (!supabaseConfigured) throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

async function supabaseFetch<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  requireConfig();
  const headers = new Headers(init.headers);
  headers.set("apikey", anonKey);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${url}${path}`, { ...init, headers, cache: "no-store" });
  const raw = await response.text();
  let body: unknown = null;
  try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }
  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "msg" in body && typeof body.msg === "string"
      ? body.msg
      : typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
        ? body.message
        : typeof body === "object" && body !== null && "error_description" in body && typeof body.error_description === "string"
          ? body.error_description
          : `Supabase request failed (${response.status}).`;
    throw new Error(message);
  }
  return body as T;
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  return supabaseFetch<SupabaseSession>("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, data: { display_name: displayName } }),
  });
}

export async function signInWithEmail(email: string, password: string) {
  return supabaseFetch<SupabaseSession>("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshSession(refreshToken: string) {
  return supabaseFetch<SupabaseSession>("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function getUser(accessToken: string) {
  return supabaseFetch<SupabaseUser>("/auth/v1/user", { method: "GET" }, accessToken);
}

export async function signOutSupabase(accessToken: string) {
  await supabaseFetch<null>("/auth/v1/logout", { method: "POST" }, accessToken);
}

export async function requestPasswordReset(email: string, redirectTo: string) {
  return supabaseFetch<unknown>("/auth/v1/recover", {
    method: "POST",
    body: JSON.stringify({ email, redirect_to: redirectTo }),
  });
}

export async function verifyEmailToken(tokenHash: string, type: string, redirectTo: string) {
  return supabaseFetch<SupabaseSession>(`/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "GET",
  });
}

export async function updatePassword(accessToken: string, password: string) {
  return supabaseFetch<SupabaseUser>("/auth/v1/user", {
    method: "PUT",
    body: JSON.stringify({ password }),
  }, accessToken);
}

export async function postTable<T>(table: string, value: unknown, accessToken: string) {
  return supabaseFetch<T>(`/rest/v1/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(value),
  }, accessToken);
}

export async function upsertTable<T>(table: string, value: unknown, accessToken: string, onConflict: string) {
  return supabaseFetch<T>(`/rest/v1/${encodeURIComponent(table)}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(value),
  }, accessToken);
}

export async function selectTable<T>(table: string, query: string, accessToken: string) {
  return supabaseFetch<T>(`/rest/v1/${encodeURIComponent(table)}?${query}`, { method: "GET" }, accessToken);
}

export async function deleteTable(table: string, query: string, accessToken: string) {
  return supabaseFetch<unknown>(`/rest/v1/${encodeURIComponent(table)}?${query}`, { method: "DELETE" }, accessToken);
}
