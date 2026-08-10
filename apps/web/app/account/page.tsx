"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { loadProfile, updateProfile } from "../lib/supabase-browser";
import { useAccount } from "../auth-provider";
import "../auth/auth-shell.css";

export default function AccountPage() {
  const { user, mode, authReady, signOut } = useAccount();
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authReady || mode !== "email") return;
    void loadProfile().then((profile) => setDisplayName(profile?.display_name ?? user?.displayName ?? "Founder")).catch(() => setDisplayName(user?.displayName ?? "Founder"));
  }, [authReady, mode, user]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setError("");
    try { await updateProfile(displayName.trim() || "Founder"); setMessage("Profile saved."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save profile."); }
  }

  if (!authReady) return <main className="auth-page"><section className="auth-card"><p className="auth-copy">Loading account…</p></section></main>;
  if (mode !== "email" || !user) return <main className="auth-page"><section className="auth-card"><div className="auth-brand">EnterpriseVerse</div><h1 className="auth-title">Your account</h1><p className="auth-copy">You're playing as a guest. Create an email account to keep your progress in the cloud.</p><Link className="auth-button" href="/auth/signup">Create account</Link></section></main>;

  return <main className="auth-page"><section className="auth-card" aria-labelledby="account-title">
    <div className="auth-brand">EnterpriseVerse</div>
    <h1 id="account-title" className="auth-title">Account settings.</h1>
    <p className="auth-copy">Manage your founder profile and secure cloud account.</p>
    <form className="auth-form" onSubmit={save}>
      <label className="auth-label">Display name<input className="auth-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} required /></label>
      <label className="auth-label">Email<input className="auth-input" value={user.email ?? ""} readOnly /></label>
      <button className="auth-button">Save profile</button>
    </form>
    {error && <p className="auth-alert" role="alert">{error}</p>}
    {message && <p className="auth-success" role="status">{message}</p>}
    <div className="auth-links"><Link href="/">Back to simulation</Link><button className="auth-button secondary" type="button" onClick={() => void signOut()}>Sign out</button></div>
  </section></main>;
}
