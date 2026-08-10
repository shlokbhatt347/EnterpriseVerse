"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AccountUser = { id: string; displayName: string; email: string | null; emailConfirmed: boolean };
type AuthMode = "loading" | "guest" | "email";
type AccountContextValue = {
  user: AccountUser | null;
  mode: AuthMode;
  authReady: boolean;
  cloudReady: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<{ ok: boolean; requiresVerification?: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  saveBusiness: (key: string, value: unknown) => Promise<void>;
  loadBusiness: <T>(key: string) => Promise<T | null>;
  deleteBusiness: (key: string) => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);
const GUEST_KEY = "enterpriseverse:account:v2";
const ACTIVE_SAVE_KEY = "enterpriseverse:active-business:v1";

function guestUser(): AccountUser {
  try {
    const existing = window.localStorage.getItem(GUEST_KEY);
    if (existing) return JSON.parse(existing) as AccountUser;
  } catch { /* recover below */ }
  const user: AccountUser = { id: `guest_${crypto.randomUUID()}`, displayName: "Guest Founder", email: null, emailConfirmed: false };
  try { window.localStorage.setItem(GUEST_KEY, JSON.stringify(user)); } catch { /* local storage may be unavailable */ }
  return user;
}

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, cache: "no-store" });
    const body = await response.json().catch(() => ({})) as T & { error?: string };
    if (!response.ok) return { error: typeof body.error === "string" ? body.error : "Request failed." };
    return { data: body };
  } catch { return { error: "Network error. Please try again." }; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [mode, setMode] = useState<AuthMode>("loading");
  const [authReady, setAuthReady] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);

  const refresh = useCallback(async () => {
    const result = await jsonRequest<{ authenticated: boolean; user: AccountUser | null }>("/api/auth/session");
    if (result.data?.authenticated && result.data.user) {
      setUser(result.data.user); setMode("email");
    } else {
      setUser(guestUser()); setMode("guest"); setCloudReady(false);
    }
    setAuthReady(true);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!authReady || mode !== "email") return;
    let active = true;
    setCloudReady(false);
    (async () => {
      try {
        const result = await jsonRequest<{ save: { payload: unknown } | null }>(`/api/saves?key=${encodeURIComponent(ACTIVE_SAVE_KEY)}`);
        if (!active) return;
        const localRaw = window.localStorage.getItem(ACTIVE_SAVE_KEY);
        if (result.data?.save) {
          window.localStorage.setItem(ACTIVE_SAVE_KEY, JSON.stringify(result.data.save.payload));
        } else if (localRaw) {
          await jsonRequest("/api/saves", { method: "PUT", body: JSON.stringify({ key: ACTIVE_SAVE_KEY, payload: JSON.parse(localRaw) as unknown }) });
        }
      } catch { /* Local gameplay remains available during transient cloud failures. */ }
      if (active) setCloudReady(true);
    })();
    return () => { active = false; };
  }, [authReady, mode, user?.id]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const result = await jsonRequest<{ user: AccountUser }>("/api/auth/signin", { method: "POST", body: JSON.stringify({ email, password }) });
    if (result.error || !result.data?.user) return { ok: false, error: result.error ?? "Unable to sign in." };
    setCloudReady(false); setUser(result.data.user); setMode("email");
    return { ok: true };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
    const result = await jsonRequest<{ user: AccountUser | null; requiresVerification: boolean }>("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password, displayName }) });
    if (result.error) return { ok: false, error: result.error };
    if (result.data?.user) { setCloudReady(false); setUser(result.data.user); setMode("email"); }
    return { ok: true, requiresVerification: result.data?.requiresVerification ?? true };
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const result = await jsonRequest("/api/auth/recover", { method: "POST", body: JSON.stringify({ email }) });
    return result.error ? { ok: false, error: result.error } : { ok: true };
  }, []);

  const continueAsGuest = useCallback(() => { setCloudReady(false); setUser(guestUser()); setMode("guest"); }, []);

  const signOut = useCallback(async () => {
    await jsonRequest("/api/auth/signout", { method: "POST" });
    setCloudReady(false); setUser(guestUser()); setMode("guest");
  }, []);

  const saveBusiness = useCallback(async (key: string, value: unknown) => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* cloud remains available */ }
    if (mode !== "email" || !cloudReady) return;
    await jsonRequest("/api/saves", { method: "PUT", body: JSON.stringify({ key, payload: value }) });
  }, [cloudReady, mode]);

  const loadBusiness = useCallback(async <T,>(key: string): Promise<T | null> => {
    if (mode === "email" && cloudReady) {
      const result = await jsonRequest<{ save: { payload: T } | null }>(`/api/saves?key=${encodeURIComponent(key)}`);
      if (result.data?.save) return result.data.save.payload;
    }
    try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) as T : null; } catch { return null; }
  }, [cloudReady, mode]);

  const deleteBusiness = useCallback(async (key: string) => {
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
    if (mode === "email" && cloudReady) await jsonRequest(`/api/saves?key=${encodeURIComponent(key)}`, { method: "DELETE" });
  }, [cloudReady, mode]);

  const value = useMemo(() => ({ user, mode, authReady, cloudReady, signInWithEmail, signUpWithEmail, requestPasswordReset, continueAsGuest, signOut, saveBusiness, loadBusiness, deleteBusiness }), [user, mode, authReady, cloudReady, signInWithEmail, signUpWithEmail, requestPasswordReset, continueAsGuest, signOut, saveBusiness, loadBusiness, deleteBusiness]);
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() { const value = useContext(AccountContext); if (!value) throw new Error("useAccount must be used inside AuthProvider"); return value; }
