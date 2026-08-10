"use client";

export type BrowserUser = { id: string; email: string | null; displayName: string; emailConfirmed: boolean };
type Session = { access_token: string; refresh_token: string; expires_in: number; expires_at?: number; user: { id: string; email?: string; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> } };
type SaveRow = { save_key: string; payload: unknown; updated_at: string };

const STORAGE_KEY = "enterpriseverse:supabase-session:v1";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseConfigured = Boolean(url && anonKey);
function requireConfig() { if (!supabaseConfigured) throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."); }
function readSession(): Session | null { try { const raw = window.localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) as Session : null; } catch { return null; } }
function writeSession(session: Session | null) { try { if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); else window.localStorage.removeItem(STORAGE_KEY); } catch { /* storage may be unavailable */ } }
function userFromSession(session: Session): BrowserUser { return { id: session.user.id, email: session.user.email ?? null, displayName: typeof session.user.user_metadata?.display_name === "string" ? session.user.user_metadata.display_name : "Founder", emailConfirmed: Boolean(session.user.email_confirmed_at) }; }

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  requireConfig();
  const headers = new Headers(init.headers); headers.set("apikey", anonKey); headers.set("Content-Type", "application/json"); if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${url}${path}`, { ...init, headers, cache: "no-store" });
  const raw = await response.text(); let body: unknown = null; try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }
  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "msg" in body && typeof body.msg === "string" ? body.msg : typeof body === "object" && body !== null && "message" in body && typeof body.message === "string" ? body.message : typeof body === "object" && body !== null && "error_description" in body && typeof body.error_description === "string" ? body.error_description : `Supabase request failed (${response.status}).`;
    throw new Error(message);
  }
  return body as T;
}

async function refreshIfNeeded(): Promise<Session | null> {
  const session = readSession(); if (!session) return null;
  const expiresAt = session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in;
  if (expiresAt - Math.floor(Date.now() / 1000) > 60) return session;
  try { const next = await request<Session>("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: session.refresh_token }) }); writeSession(next); return next; } catch { writeSession(null); return null; }
}

export function getStoredUser(): BrowserUser | null { const session = readSession(); return session ? userFromSession(session) : null; }

export async function restoreSessionFromUrl() {
  if (typeof window === "undefined" || !supabaseConfigured) return getStoredUser();
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, "")); const accessToken = hash.get("access_token"); const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    const rawExpiresIn = Number(hash.get("expires_in") ?? "3600"); const expiresIn = Number.isFinite(rawExpiresIn) ? rawExpiresIn : 3600;
    const user = await request<Session["user"]>("/auth/v1/user", { method: "GET" }, accessToken);
    writeSession({ access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn, expires_at: Math.floor(Date.now() / 1000) + expiresIn, user });
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
  }
  return getStoredUser();
}

export async function getCurrentUser(): Promise<BrowserUser | null> { const session = await refreshIfNeeded(); if (!session) return null; try { const user = await request<Session["user"]>("/auth/v1/user", { method: "GET" }, session.access_token); return userFromSession({ ...session, user }); } catch { writeSession(null); return null; } }
export async function signInWithEmail(email: string, password: string) { const session = await request<Session>("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) }); writeSession(session); return userFromSession(session); }
export async function signUpWithEmail(email: string, password: string, displayName: string) { const redirectTo = `${window.location.origin}${window.location.pathname.replace(/\/auth\/signup\/?$/, "/")}`; const session = await request<Session>(`/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`, { method: "POST", body: JSON.stringify({ email, password, data: { display_name: displayName } }) }); if (session?.access_token) writeSession(session); return { user: session?.user ? userFromSession(session) : null, requiresVerification: !session?.access_token }; }
export async function requestPasswordReset(email: string) { const redirectTo = `${window.location.origin}${window.location.pathname.replace(/\/auth\/recover\/?$/, "/auth/reset")}`; await request<unknown>("/auth/v1/recover", { method: "POST", body: JSON.stringify({ email, redirect_to: redirectTo }) }); }
export async function updatePassword(password: string) { const session = await refreshIfNeeded(); if (!session) throw new Error("Reset link expired. Request a new one."); const user = await request<Session["user"]>("/auth/v1/user", { method: "PUT", body: JSON.stringify({ password }) }, session.access_token); writeSession({ ...session, user }); }
export async function signOut() { const session = await refreshIfNeeded(); if (session) { try { await request<unknown>("/auth/v1/logout", { method: "POST" }, session.access_token); } catch { /* local session still gets cleared */ } } writeSession(null); }

async function authenticatedRequest<T>(path: string, init: RequestInit = {}) { const session = await refreshIfNeeded(); if (!session) throw new Error("Authentication required."); return request<T>(path, init, session.access_token); }
export async function loadCloudSave<T>(key: string): Promise<T | null> { const rows = await authenticatedRequest<SaveRow[]>(`/rest/v1/business_saves?select=save_key,payload,updated_at&save_key=eq.${encodeURIComponent(key)}&limit=1`); return rows[0]?.payload as T | null ?? null; }
export async function saveCloudSave(key: string, payload: unknown) { const session = await refreshIfNeeded(); if (!session) throw new Error("Authentication required."); await request("/rest/v1/business_saves?on_conflict=user_id,save_key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ user_id: session.user.id, save_key: key, payload, updated_at: new Date().toISOString() }) }, session.access_token); }
export async function deleteCloudSave(key: string) { await authenticatedRequest(`/rest/v1/business_saves?save_key=eq.${encodeURIComponent(key)}`, { method: "DELETE" }); }
export async function loadProfile() { const rows = await authenticatedRequest<Array<{ user_id: string; display_name: string; avatar_url: string | null }>>("/rest/v1/profiles?select=user_id,display_name,avatar_url&limit=1"); return rows[0] ?? null; }
export async function updateProfile(displayName: string, avatarUrl: string | null = null) { const session = await refreshIfNeeded(); if (!session) throw new Error("Authentication required."); const rows = await request<Array<{ user_id: string; display_name: string; avatar_url: string | null }>>("/rest/v1/profiles?on_conflict=user_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ user_id: session.user.id, display_name: displayName, avatar_url: avatarUrl, updated_at: new Date().toISOString() }) }, session.access_token); return rows[0] ?? null; }
