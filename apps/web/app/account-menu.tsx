"use client";

import { useState } from "react";
import { useAccount } from "./auth-provider";
import "./account-menu.css";

export default function AccountMenu() {
  const { user, mode, firebaseReady, signInWithGoogle, continueAsGuest, signOut } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const google = async () => {
    setBusy(true); setError("");
    try { await signInWithGoogle(); setOpen(false); }
    catch (err) { setError(err instanceof Error ? err.message : "Google sign-in failed."); }
    finally { setBusy(false); }
  };

  if (!user || mode === "loading") return <div className="account-chip loading">Loading account…</div>;
  return (
    <div className="account-wrap">
      <button type="button" className="account-chip" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu">
        <span className="account-avatar">{user.displayName?.slice(0, 1).toUpperCase() ?? "G"}</span>
        <span><strong>{user.displayName ?? "Guest Founder"}</strong><small>{mode === "google" ? "Google account" : "Guest · local save"}</small></span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && <div className="account-popover" role="menu">
        <div className="account-heading"><strong>{user.displayName ?? "Guest Founder"}</strong><span>{user.email ?? "Progress is saved locally on this device."}</span></div>
        {mode === "guest" ? <>
          <button type="button" className="account-action primary" onClick={google} disabled={busy || !firebaseReady}>{busy ? "Connecting…" : "Continue with Google"}</button>
          {!firebaseReady && <p className="account-hint">Google Cloud account setup is not connected yet. Guest mode remains fully usable.</p>}
          <button type="button" className="account-action" onClick={() => { continueAsGuest(); setOpen(false); }}>Continue as guest</button>
        </> : <button type="button" className="account-action" onClick={async () => { await signOut(); setOpen(false); }}>Sign out</button>}
        {error && <p className="account-error" role="alert">{error}</p>}
      </div>}
    </div>
  );
}
