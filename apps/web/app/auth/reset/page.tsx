"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, restoreSessionFromUrl, supabaseConfigured, updatePassword } from "../../lib/supabase-browser";
import "../auth-shell.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabaseConfigured) { setError("Supabase is not configured for this deployment."); return; }
    void restoreSessionFromUrl().then(async () => { if (!await getCurrentUser()) throw new Error("This reset link is invalid or has expired. Request a new link."); window.history.replaceState({}, document.title, "/auth/reset"); setReady(true); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to establish reset session."));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    try { await updatePassword(password); setMessage("Password updated. You can now sign in with your new password."); window.setTimeout(() => router.push("/auth/signin"), 900); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update password."); }
  }

  return <main className="auth-page"><section className="auth-card" aria-labelledby="reset-title">
    <div className="auth-brand">EnterpriseVerse</div>
    <h1 id="reset-title" className="auth-title">Choose a new password.</h1>
    <p className="auth-copy">Use at least 8 characters. Your new password replaces the previous one immediately.</p>
    <form className="auth-form" onSubmit={submit}>
      <label className="auth-label">New password<input className="auth-input" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={!ready} required minLength={8} /></label>
      <label className="auth-label">Confirm password<input className="auth-input" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} disabled={!ready} required minLength={8} /></label>
      <button className="auth-button" disabled={!ready}>{ready ? "Update password" : "Checking reset link…"}</button>
    </form>
    {error && <p className="auth-alert" role="alert">{error}</p>}
    {message && <p className="auth-success" role="status">{message}</p>}
    <div className="auth-links"><Link href="/auth/signin">Back to sign in</Link></div>
  </section></main>;
}
