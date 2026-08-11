"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "../../auth-provider";
import "../auth-shell.css";

export default function VerifiedPage() {
  const { user, authReady } = useAccount();
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (!authReady || !user?.emailConfirmed) return;
    const timer = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    const redirect = window.setTimeout(() => { window.location.assign("/"); }, 4000);
    return () => { window.clearInterval(timer); window.clearTimeout(redirect); };
  }, [authReady, user?.emailConfirmed]);

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="verified-title">
        <div className="auth-brand">EnterpriseVerse</div>
        <p className="auth-kicker">Account verified</p>
        <h1 id="verified-title" className="auth-title">Welcome, Founder.</h1>
        <p className="auth-copy">
          Your email has been verified successfully. Your EnterpriseVerse account is ready.
        </p>
        <div className="auth-links">
          <Link className="auth-button" href="/">Enter EnterpriseVerse</Link>
          {authReady && !user?.emailConfirmed && (
            <p className="auth-alert" role="status">Verification is complete, but your session is still loading. Refresh if this message remains.</p>
          )}
          {authReady && user?.emailConfirmed && (
            <p className="auth-success" role="status">Continuing in {countdown}s…</p>
          )}
        </div>
      </section>
    </main>
  );
}
