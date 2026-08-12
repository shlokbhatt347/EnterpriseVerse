"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "../../auth-provider";
import "../auth-shell.css";

export default function SignInPage() {
  const router = useRouter();
  const { signInWithEmail, continueAsGuest } = useAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const result = await signInWithEmail(email, password);
    setBusy(false);
    if (!result.ok) { setError(result.error ?? "Unable to sign in."); return; }
    router.push("/start");
  }

  return <main className="auth-page"><section className="auth-card" aria-labelledby="signin-title">
    <div className="auth-brand">EnterpriseVerse</div>
    <h1 id="signin-title" className="auth-title">Welcome back.</h1>
    <p className="auth-copy">Sign in to continue your company, career and simulation progress.</p>
    <form className="auth-form" onSubmit={submit}>
      <label className="auth-label">Email<input className="auth-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <label className="auth-label">Password<input className="auth-input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      <button className="auth-button" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
    {error && <p className="auth-alert" role="alert">{error}</p>}
    <div className="auth-links"><Link href="/auth/recover">Forgot password?</Link><Link href="/auth/signup">Create account</Link></div>
    <div className="auth-divider">or</div>
    <button className="auth-button secondary" type="button" onClick={() => { continueAsGuest(); router.push("/"); }}>Continue as guest</button>
  </section></main>;
}
