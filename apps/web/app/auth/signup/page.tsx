"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "../../auth-provider";
import "../auth-shell.css";

export default function SignUpPage() {
  const router = useRouter();
  const { signUpWithEmail, continueAsGuest } = useAccount();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setBusy(true);
    const result = await signUpWithEmail(email, password, displayName);
    setBusy(false);
    if (!result.ok) { setError(result.error ?? "Unable to create your account."); return; }
    if (result.requiresVerification) setMessage("Account created. Check your email to verify your account, then sign in.");
    else router.push("/");
  }

  return <main className="auth-page"><section className="auth-card" aria-labelledby="signup-title">
    <div className="auth-brand">EnterpriseVerse</div>
    <h1 id="signup-title" className="auth-title">Create your founder account.</h1>
    <p className="auth-copy">Save your enterprises in the cloud and resume your simulation on another device.</p>
    <form className="auth-form" onSubmit={submit}>
      <label className="auth-label">Name<input className="auth-input" type="text" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} required /></label>
      <label className="auth-label">Email<input className="auth-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <label className="auth-label">Password<input className="auth-input" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
      <label className="auth-label">Confirm password<input className="auth-input" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} minLength={8} required /></label>
      <button className="auth-button" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
    </form>
    {error && <p className="auth-alert" role="alert">{error}</p>}
    {message && <p className="auth-success" role="status">{message}</p>}
    <div className="auth-links"><Link href="/auth/signin">Already have an account?</Link><button className="auth-button secondary" type="button" onClick={() => { continueAsGuest(); router.push("/"); }}>Guest mode</button></div>
  </section></main>;
}
