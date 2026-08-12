"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  deleteCloudSave,
  getCurrentUser,
  getStoredUser,
  loadCloudSave,
  requestPasswordReset as supabaseRequestPasswordReset,
  restoreSessionFromUrl,
  saveCloudSave,
  signInWithEmail as supabaseSignIn,
  signOut as supabaseSignOut,
  signUpWithEmail as supabaseSignUp,
  supabaseConfigured,
} from "./lib/supabase-browser";

type AccountUser = {
  id: string;
  displayName: string;
  email: string | null;
  emailConfirmed: boolean;
};

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
const detachedSaveKey = (userId: string) => `enterpriseverse:detached-save:${userId}`;
const pendingSaves = new Map<string, Promise<void>>();

function guestUser(): AccountUser {
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    if (raw) return JSON.parse(raw) as AccountUser;
  } catch {
    /* recover below */
  }

  const user: AccountUser = {
    id: `guest_${crypto.randomUUID()}`,
    displayName: "Guest Founder",
    email: null,
    emailConfirmed: false,
  };

  try {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable */
  }

  return user;
}

function accountUser(value: Awaited<ReturnType<typeof getCurrentUser>>): AccountUser | null {
  return value
    ? {
        id: value.id,
        displayName: value.displayName,
        email: value.email,
        emailConfirmed: value.emailConfirmed,
      }
    : null;
}

function cachedAccountUser(): AccountUser | null {
  const cached = getStoredUser();
  return cached
    ? {
        id: cached.id,
        displayName: cached.displayName,
        email: cached.email,
        emailConfirmed: cached.emailConfirmed,
      }
    : null;
}

function queueCloudSave(key: string, value: unknown) {
  const previous = pendingSaves.get(key) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(() => saveCloudSave(key, value))
    .finally(() => {
      if (pendingSaves.get(key) === next) pendingSaves.delete(key);
    });

  pendingSaves.set(key, next);
  void next.catch(() => undefined);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cached = useMemo(() => (typeof window === "undefined" ? null : cachedAccountUser()), []);
  const [user, setUser] = useState<AccountUser | null>(cached);
  const [mode, setMode] = useState<AuthMode>(cached ? "email" : "loading");
  const [authReady, setAuthReady] = useState(Boolean(cached));
  const [cloudReady, setCloudReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!supabaseConfigured) {
      setUser(guestUser());
      setMode("guest");
      setCloudReady(false);
      setAuthReady(true);
      return;
    }

    // Restore an auth callback first when the browser contains a fresh token.
    // Normal page loads skip this network work and use the cached session immediately.
    try {
      await restoreSessionFromUrl();
    } catch {
      // Invalid callback tokens should not block application startup.
    }

    const cachedUser = cachedAccountUser();
    if (cachedUser) {
      setUser(cachedUser);
      setMode("email");
      setCloudReady(true);
      setAuthReady(true);

      // Validate the cached session in the background. The UI no longer waits for this request.
      try {
        const verified = accountUser(await getCurrentUser());
        if (verified) {
          setUser(verified);
          setMode("email");
        } else {
          setUser(guestUser());
          setMode("guest");
          setCloudReady(false);
        }
      } catch {
        // Keep the cached identity usable; any protected request will surface the auth error.
      }
      return;
    }

    // No cached session: guest mode becomes available immediately, while Supabase is checked once.
    setUser(guestUser());
    setMode("guest");
    setCloudReady(false);
    setAuthReady(true);

    try {
      const verified = accountUser(await getCurrentUser());
      if (verified) {
        setUser(verified);
        setMode("email");
        setCloudReady(true);
      }
    } catch {
      // Guest mode remains available when the network/auth service is unavailable.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!authReady || mode !== "email" || !user?.id) return;

    let active = true;
    const backupKey = detachedSaveKey(user.id);

    // Cloud reconciliation is deliberately background work. It must never block account/UI startup.
    void (async () => {
      try {
        const cloud = await loadCloudSave<unknown>(ACTIVE_SAVE_KEY);
        if (!active) return;

        const localRaw = window.localStorage.getItem(ACTIVE_SAVE_KEY);
        const backupRaw = window.localStorage.getItem(backupKey);

        if (cloud !== null) {
          window.localStorage.setItem(ACTIVE_SAVE_KEY, JSON.stringify(cloud));
          window.localStorage.removeItem(backupKey);
        } else if (backupRaw && !localRaw) {
          window.localStorage.setItem(ACTIVE_SAVE_KEY, backupRaw);
          queueCloudSave(ACTIVE_SAVE_KEY, JSON.parse(backupRaw) as unknown);
          window.localStorage.removeItem(backupKey);
        } else if (localRaw) {
          queueCloudSave(ACTIVE_SAVE_KEY, JSON.parse(localRaw) as unknown);
        }
      } catch {
        // Local-first gameplay remains available during cloud/network failures.
      }
    })();

    return () => {
      active = false;
    };
  }, [authReady, mode, user?.id]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const next = accountUser(await supabaseSignIn(email.trim().toLowerCase(), password));
      if (!next) return { ok: false, error: "Unable to sign in." };
      setUser(next);
      setMode("email");
      setCloudReady(true);
      setAuthReady(true);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Unable to sign in." };
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const result = await supabaseSignUp(email.trim().toLowerCase(), password, displayName.trim());
      if (result.requiresVerification) {
        setCloudReady(false);
        setUser(guestUser());
        setMode("guest");
        setAuthReady(true);
        return { ok: true, requiresVerification: true };
      }
      if (!result.user) {
        return {
          ok: false,
          error: "Account was created but no active session was returned. Please sign in.",
        };
      }
      setUser(accountUser(result.user) as AccountUser);
      setMode("email");
      setCloudReady(true);
      setAuthReady(true);
      return { ok: true, requiresVerification: false };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Unable to create your account." };
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      await supabaseRequestPasswordReset(email.trim().toLowerCase());
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Unable to send the reset email." };
    }
  }, []);

  const continueAsGuest = useCallback(() => {
    setCloudReady(false);
    setUser(guestUser());
    setMode("guest");
    setAuthReady(true);
  }, []);

  const signOut = useCallback(async () => {
    const currentUserId = user?.id;
    if (mode === "email" && currentUserId) {
      try {
        const raw = window.localStorage.getItem(ACTIVE_SAVE_KEY);
        if (raw) {
          window.localStorage.setItem(detachedSaveKey(currentUserId), raw);
          queueCloudSave(ACTIVE_SAVE_KEY, JSON.parse(raw) as unknown);
        }
        window.localStorage.removeItem(ACTIVE_SAVE_KEY);
      } catch {
        /* cloud data remains the source of truth */
      }
    }

    try {
      await supabaseSignOut();
    } finally {
      setCloudReady(false);
      setUser(guestUser());
      setMode("guest");
      setAuthReady(true);
    }
  }, [mode, user?.id]);

  const saveBusiness = useCallback(async (key: string, value: unknown) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore local storage failure */
    }

    if (mode === "email" && cloudReady) {
      queueCloudSave(key, value);
    }
  }, [cloudReady, mode]);

  const loadBusiness = useCallback(async <T,>(key: string): Promise<T | null> => {
    if (mode === "email" && cloudReady) {
      try {
        const cloud = await loadCloudSave<T>(key);
        if (cloud !== null) return cloud;
      } catch {
        /* fall through to local save */
      }
    }

    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }, [cloudReady, mode]);

  const deleteBusiness = useCallback(async (key: string) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }

    pendingSaves.delete(key);

    if (mode === "email" && cloudReady) {
      try {
        await deleteCloudSave(key);
      } catch {
        /* local state is already deleted */
      }
    }
  }, [cloudReady, mode]);

  const value = useMemo(
    () => ({
      user,
      mode,
      authReady,
      cloudReady,
      signInWithEmail,
      signUpWithEmail,
      requestPasswordReset,
      continueAsGuest,
      signOut,
      saveBusiness,
      loadBusiness,
      deleteBusiness,
    }),
    [
      user,
      mode,
      authReady,
      cloudReady,
      signInWithEmail,
      signUpWithEmail,
      requestPasswordReset,
      continueAsGuest,
      signOut,
      saveBusiness,
      loadBusiness,
      deleteBusiness,
    ],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AuthProvider");
  return value;
}
