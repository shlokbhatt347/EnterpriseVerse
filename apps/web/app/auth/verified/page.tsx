"use client";

import Link from "next/link";
import "../auth-shell.css";

const PRODUCTION_HOME = "https://shlokbhatt347.github.io/EnterpriseVerse/";

export default function VerifiedPage() {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="verified-title">
        <div className="auth-brand">EnterpriseVerse</div>
        <p className="auth-kicker">Authentication complete</p>
        <h1 id="verified-title" className="auth-title">
          You're ready to enter EnterpriseVerse.
        </h1>
        <p className="auth-copy">
          Email verification is disabled for this prototype, so new accounts can continue directly into the simulation.
        </p>
        <div className="auth-links">
          <a className="auth-button" href={PRODUCTION_HOME}>
            Continue to Simulation
          </a>
          <Link className="auth-button secondary" href="/auth/signin">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
