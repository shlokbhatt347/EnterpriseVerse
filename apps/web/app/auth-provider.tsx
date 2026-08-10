"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type FirebaseUser = { uid: string; displayName: string | null; email: string | null; photoURL: string | null };
type AuthMode = "loading" | "guest" | "google";
type AccountContextValue = {
  user: FirebaseUser | null;
  mode: AuthMode;
  firebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  saveBusiness: (key: string, value: unknown) => Promise<void>;
  loadBusiness: <T>(key: string) => Promise<T | null>;
  deleteBusiness: (key: string) => Promise<void>;
};

declare global { interface Window { firebase?: any } }

const AccountContext = createContext<AccountContextValue | null>(null);
const GUEST_KEY = "enterpriseverse:account:v1";
const FIREBASE_VERSION = "10.14.1";
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};
export const firebaseConfigured = Object.values(config).every(Boolean);

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) { if (window.firebase) resolve(); else existing.addEventListener("load", () => resolve(), { once: true }); return; }
    const script = document.createElement("script");
    script.src = src; script.async = true;
    script.onload = () => resolve(); script.onerror = () => reject(new Error("SDK load failed"));
    document.head.appendChild(script);
  });
}

async function ensureFirebase(): Promise<any> {
  if (!firebaseConfigured) throw new Error("Cloud authentication is not configured.");
  await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`);
  await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth-compat.js`);
  await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore-compat.js`);
  if (!window.firebase) throw new Error("Firebase SDK failed to initialise.");
  if (window.firebase.apps.length === 0) window.firebase.initializeApp(config);
  return window.firebase;
}

function guestUser(): FirebaseUser {
  try { const existing = window.localStorage.getItem(GUEST_KEY); if (existing) return JSON.parse(existing) as FirebaseUser; } catch { /* recover below */ }
  const user: FirebaseUser = { uid: `guest_${crypto.randomUUID()}`, displayName: "Guest Founder", email: null, photoURL: null };
  try { window.localStorage.setItem(GUEST_KEY, JSON.stringify(user)); } catch { /* storage can be unavailable */ }
  return user;
}

const docId = (key: string) => key.replace(/[^a-zA-Z0-9_-]/g, "_");

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [mode, setMode] = useState<AuthMode>("loading");
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    let active = true; let unsubscribe: (() => void) | undefined;
    (async () => {
      if (!firebaseConfigured) { if (active) { setUser(guestUser()); setMode("guest"); } return; }
      try {
        const firebase = await ensureFirebase();
        if (!active) return;
        setFirebaseReady(true);
        unsubscribe = firebase.auth().onAuthStateChanged((nextUser: FirebaseUser | null) => { if (active) { setUser(nextUser); setMode(nextUser ? "google" : "guest"); } });
      } catch { if (active) { setUser(guestUser()); setMode("guest"); } }
    })();
    return () => { active = false; unsubscribe?.(); };
  }, []);

  const continueAsGuest = useCallback(() => { setUser(guestUser()); setMode("guest"); }, []);
  const signInWithGoogle = useCallback(async () => {
    const firebase = await ensureFirebase(); setFirebaseReady(true);
    await firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }, []);
  const signOut = useCallback(async () => {
    if (firebaseReady && window.firebase) await window.firebase.auth().signOut();
    setUser(guestUser()); setMode("guest");
  }, [firebaseReady]);

  const saveBusiness = useCallback(async (key: string, value: unknown) => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* cloud fallback */ }
    if (mode !== "google" || !user || !firebaseReady || !window.firebase) return;
    await window.firebase.firestore().collection("users").doc(user.uid).collection("businesses").doc(docId(key)).set({ value, updatedAt: new Date().toISOString() }, { merge: true });
  }, [firebaseReady, mode, user]);

  const loadBusiness = useCallback(async <T,>(key: string): Promise<T | null> => {
    if (mode === "google" && user && firebaseReady && window.firebase) {
      try { const snap = await window.firebase.firestore().collection("users").doc(user.uid).collection("businesses").doc(docId(key)).get(); if (snap.exists) return (snap.data() as { value: T }).value; } catch { /* offline fallback */ }
    }
    try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) as T : null; } catch { return null; }
  }, [firebaseReady, mode, user]);

  const deleteBusiness = useCallback(async (key: string) => {
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
    if (mode === "google" && user && firebaseReady && window.firebase) await window.firebase.firestore().collection("users").doc(user.uid).collection("businesses").doc(docId(key)).delete();
  }, [firebaseReady, mode, user]);

  const value = useMemo(() => ({ user, mode, firebaseReady, signInWithGoogle, continueAsGuest, signOut, saveBusiness, loadBusiness, deleteBusiness }), [user, mode, firebaseReady, signInWithGoogle, continueAsGuest, signOut, saveBusiness, loadBusiness, deleteBusiness]);
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() { const value = useContext(AccountContext); if (!value) throw new Error("useAccount must be used inside AuthProvider"); return value; }
