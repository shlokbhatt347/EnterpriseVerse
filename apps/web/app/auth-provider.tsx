"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  getStoredUser,
  loadCloudSave,
  requestPasswordReset as supabaseRequestPasswordReset,
  restoreSessionFromUrl,
  saveCloudSave,
  deleteCloudSave,
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
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<{ ok: boolean; error?: string }>;
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
  const cachedUser = useMemo(() => cachedAccountUser(), []);
  const [user, setUser] = useState<AccountUser | null>(cachedUser);
  const [mode, setMode] = useState<AuthMode>(cachedUser ? "email" : "loading");
  const [authReady, setAuthReady] = useState(Boolean(cachedUser) || !supabaseConfigured);
  const [cloudReady, setCloudReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!supabaseConfigured) {
      setUser(guestUser());
      setMode("guest");
      setCloudReady(false);
      setAuthReady(true);
      return;
    }

    try {
      await restoreSessionFromUrl();
      const next = accountUser(await getCurrentUser());
      setUser(next ?? guestUser());
      setMode(next ? "email" : "guest");
    } catch {
      setUser(guestUser());
      setMode("guest");
      setCloudReady(false);
    }

    setAuthReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!authReady || mode !== "email" || !user?.id) return;

    let active = true;
    setCloudReady(false);

    (async () => {
      const backupKey = detachedSaveKey(user.id);

      try {
        const localRaw = window.localStorage.getItem(ACTIVE_SAVE_KEY);
        const backupRaw = window.localStorage.getItem(backupKey);

        if (localRaw || backupRaw) setCloudReady(true);

        const cloud = await loadCloudSave<unknown>(ACTIVE_SAVE_KEY);
        if (!active) return;

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
        /* local-first gameplay survives cloud/network failures */
      }

      if (active) setCloudReady(true);
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
      setCloudReady(false);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to sign in.",
      };
    }
  }, []);

  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    try {
      const result = await supabaseSignUp(
        email.trim().toLowerCase(),
        password,
        displayName.trim(),
      );

      if (!result.user) {
        return {
          ok: false,
          error:
            "Account creation did not return an active session. Disable email confirmation in Supabase Auth and try again.",
        };
      }

      setUser(accountUser(result.user) as AccountUser);
      setMode("email");
      setCloudReady(false);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to create your account.",
      };
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      await supabaseRequestPasswordReset(email.trim().toLowerCase());
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to send the reset email.",
      };
    }
  }, []);

  const continueAsGuest = useCallback(() => {
    setCloudReady(false);
    setUser(guestUser());
    setMode("guest");
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
    }
  }, [mode, user?.id]);

  const saveBusiness = useCallback(async (key: string, value: unknown) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore local storage failure */
    }

    if (mode === "email" && cloudReady) queueCloudSave(key, value);
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

    if (mode === "email" && cloudReady) {
      pendingSaves.delete(key);
      try {
        await deleteCloudSave(key);
      } catch {
        /* local state already deleted */
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

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AuthProvider");
  return value;
}
