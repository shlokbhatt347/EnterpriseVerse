"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useAccount } from "../../auth-provider";
import "../auth-shell.css";

export default function RecoverPage() {
  const { requestPasswordReset } = useAccount();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const result = await requestPasswordReset(email);
    setBusy(false);
    if (!result.ok) { setError(result.error ?? "Unable to send the reset email."); return; }
    setMessage("If an account exists for that email, a password reset link has been sent.");
  }

  return <main className="auth-page"><section className="auth-card" aria-labelledby="recover-title">
    <div className="auth-brand">EnterpriseVerse</div>
    <h1 id="recover-title" className="auth-title">Reset your password.</h1>
    <p className="auth-copy">Enter your account email and we'll send a secure password reset link.</p>
    <form className="auth-form" onSubmit={submit}>
      <label className="auth-label">Email<input className="auth-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <button className="auth-button" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
    </form>
    {error && <p className="auth-alert" role="alert">{error}</p>}
    {message && <p className="auth-success" role="status">{message}</p>}
    <div className="auth-links"><Link href="/auth/signin">Back to sign in</Link></div>
  </section></main>;
}
