"use client";

export type BrowserUser = {
  id: string;
  email: string | null;
  displayName: string;
  emailConfirmed: boolean;
};

type Session = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  user: { id: string; email?: string; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> };
};

type SaveRow = { save_key: string; payload: unknown; updated_at: string };

const STORAGE_KEY = "enterpriseverse:supabase-session:v1";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
const PRODUCTION_SITE_URL = "https://shlokbhatt347.github.io/EnterpriseVerse/";
const SESSION_REFRESH_SAFETY_WINDOW_SECONDS = 60;

export const supabaseConfigured = Boolean(url && anonKey);
let refreshPromise: Promise<Session | null> | null = null;

function requireConfig() {
  if (!supabaseConfigured) throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

function readSession(): Session | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch { return null; }
}

function writeSession(value: Session | null) {
  try {
    if (typeof window === "undefined") return;
    if (value) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch { /* storage may be unavailable */ }
}

function userFromSession(session: Session): BrowserUser {
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    displayName: typeof session.user.user_metadata?.display_name === "string" ? session.user.user_metadata.display_name : "Founder",
    emailConfirmed: Boolean(session.user.email_confirmed_at),
  };
}

function getSiteUrl(): string {
  if (configuredSiteUrl) return configuredSiteUrl.replace(/\/$/, "") + "/";
  if (process.env.NODE_ENV === "production") return PRODUCTION_SITE_URL;
  const basePath = window.location.pathname.split("/auth/")[0] || "/";
  return `${window.location.origin}${basePath}`.replace(/([^:]\/)\/+$/, "$1") + "/";
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  requireConfig();
  const headers = new Headers(init.headers);
  headers.set("apikey", anonKey);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${url}${path}`, { ...init, headers, cache: "no-store" });
  const raw = await response.text();
  let body: unknown = null;
  try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }
  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "msg" in body && typeof body.msg === "string" ? body.msg : typeof body === "object" && body !== null && "message" in body && typeof body.message === "string" ? body.message : typeof body === "object" && body !== null && "error_description" in body && typeof body.error_description === "string" ? body.error_description : `Supabase request failed (${response.status}).`;
    throw new Error(message);
  }
  return body as T;
}

async function refreshIfNeeded(): Promise<Session | null> {
  if (refreshPromise) return refreshPromise;
  const current = readSession();
  if (!current) return null;
  const expiresAt = current.expires_at ?? Math.floor(Date.now() / 1000) + current.expires_in;
  if (expiresAt - Math.floor(Date.now() / 1000) > SESSION_REFRESH_SAFETY_WINDOW_SECONDS) return current;
  refreshPromise = (async () => {
    try {
      const next = await request<Session>("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: current.refresh_token }) });
      writeSession(next);
      return next;
    } catch {
      writeSession(null);
      return null;
    } finally { refreshPromise = null; }
  })();
  return refreshPromise;
}

export function getStoredUser(): BrowserUser | null {
  const current = readSession();
  return current ? userFromSession(current) : null;
}

export async function restoreSessionFromUrl() {
  if (typeof window === "undefined" || !supabaseConfigured) return getStoredUser();
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    const raw = Number(hash.get("expires_in") ?? "3600");
    const expiresIn = Number.isFinite(raw) ? raw : 3600;
    const user = await request<Session["user"]>("/auth/v1/user", { method: "GET" }, accessToken);
    writeSession({ access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn, expires_at: Math.floor(Date.now() / 1000) + expiresIn, user });
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
  }
  return getStoredUser();
}

export async function getCurrentUser(): Promise<BrowserUser | null> {
  // The session persisted by Supabase already contains the user identity. Avoid an
  // extra /auth/v1/user request on every page load; only refresh when the token is
  // close to expiry. Authenticated data requests still carry the access token and
  // remain server-authoritative.
  const current = await refreshIfNeeded();
  return current ? userFromSession(current) : null;
}

export async function signInWithEmail(email: string, password: string) {
  const current = await request<Session>("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
  writeSession(current);
  return userFromSession(current);
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const current = await request<Session>("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email, password, data: { display_name: displayName } }) });
  if (!current?.access_token || !current.user) throw new Error("Account creation did not return an active session. Disable email confirmations in Supabase Auth Providers.");
  writeSession(current);
  return userFromSession(current);
}

export async function requestPasswordReset(email: string) {
  const redirectTo = new URL("auth/reset", PRODUCTION_SITE_URL).toString();
  await request<unknown>("/auth/v1/recover", { method: "POST", body: JSON.stringify({ email, redirect_to: redirectTo }) });
}

export async function updatePassword(password: string) {
  const current = await refreshIfNeeded();
  if (!current) throw new Error("Reset link expired. Request a new one.");
  const user = await request<Session["user"]>("/auth/v1/user", { method: "PUT", body: JSON.stringify({ password }) }, current.access_token);
  writeSession({ ...current, user });
}

export async function signOut() {
  const current = await refreshIfNeeded();
  if (current) {
    try { await request<unknown>("/auth/v1/logout", { method: "POST" }, current.access_token); } catch { /* local session still gets cleared */ }
  }
  writeSession(null);
}

async function authenticatedRequest<T>(path: string, init: RequestInit = {}) {
  const current = await refreshIfNeeded();
  if (!current) throw new Error("Authentication required.");
  return request<T>(path, init, current.access_token);
}

export async function loadCloudSave<T>(key: string): Promise<T | null> {
  const rows = await authenticatedRequest<SaveRow[]>(`/rest/v1/business_saves?select=save_key,payload,updated_at&save_key=eq.${encodeURIComponent(key)}&limit=1`);
  return (rows[0]?.payload as T | null) ?? null;
}

export async function saveCloudSave(key: string, payload: unknown) {
  const current = await refreshIfNeeded();
  if (!current) throw new Error("Authentication required.");
  await request("/rest/v1/business_saves?on_conflict=user_id,save_key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ user_id: current.user.id, save_key: key, payload, updated_at: new Date().toISOString() }) }, current.access_token);
}

export async function deleteCloudSave(key: string) { await authenticatedRequest(`/rest/v1/business_saves?save_key=eq.${encodeURIComponent(key)}`, { method: "DELETE" }); }

export async function loadProfile() {
  const rows = await authenticatedRequest<Array<{ user_id: string; display_name: string; avatar_url: string | null }>>("/rest/v1/profiles?select=user_id,display_name,avatar_url&limit=1");
  return rows[0] ?? null;
}

export async function updateProfile(displayName: string, avatarUrl: string | null = null) {
  const current = await refreshIfNeeded();
  if (!current) throw new Error("Authentication required.");
  const rows = await request<Array<{ user_id: string; display_name: string; avatar_url: string | null }>>("/rest/v1/profiles?on_conflict=user_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ user_id: current.user.id, display_name: displayName, avatar_url: avatarUrl, updated_at: new Date().toISOString() }) }, current.access_token);
  return rows[0] ?? null;
}
