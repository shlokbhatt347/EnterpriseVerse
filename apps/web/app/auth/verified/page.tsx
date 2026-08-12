"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser, resendSignupVerification } from "../../lib/supabase-browser";
import "../auth-shell.css";

const PRODUCTION_HOME = "https://shlokbhatt347.github.io/EnterpriseVerse/";

export default function VerifiedPage() {
  const user = getStoredUser();
  const [email, setEmail] = useState(user?.email ?? "");
  const [countdown, setCountdown] = useState(5);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.emailConfirmed) return;

    const timer = window.setInterval(() => {
      setCountdown((value) => Math.max(0, value - 1));
    }, 1000);

    const redirect = window.setTimeout(() => {
      window.location.assign(PRODUCTION_HOME);
    }, 5000);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(redirect);
    };
  }, [user?.emailConfirmed]);

  async function resend() {
    const normalized = email.trim().toLowerCase();

    if (!normalized) {
      setError("Enter the email address you used to sign up.");
      return;
    }

    setResending(true);
    setError("");
    setMessage("");

    try {
      await resendSignupVerification(normalized);
      setMessage(
        "A fresh verification email has been sent. Check your inbox and use the newest link.",
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to send a new verification email.",
      );
    } finally {
      setResending(false);
    }
  }

  const verified = Boolean(user?.emailConfirmed);

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="verified-title">
        <div className="auth-brand">EnterpriseVerse</div>
        <p className="auth-kicker">
          {verified ? "Account verified" : "Email verification"}
        </p>
        <h1 id="verified-title" className="auth-title">
          {verified
            ? "Email verified successfully."
            : "Verify your email to continue."}
        </h1>
        <p className="auth-copy">
          {verified
            ? "Your account is verified and ready. You can continue into the EnterpriseVerse simulation."
            : "This verification link is invalid, expired, or the session is not available yet. Request a fresh link below."}
        </p>

        <div className="auth-links">
          <a className="auth-button" href={PRODUCTION_HOME}>
            Continue to Simulation
          </a>

          {verified && (
            <p className="auth-success" role="status">
              Redirecting to EnterpriseVerse in {countdown}s…
            </p>
          )}

          {!verified && (
            <div className="auth-form" style={{ marginTop: 16 }}>
              <label htmlFor="verification-email">Email address</label>
              <input
                id="verification-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
              <button
                className="auth-button"
                type="button"
                onClick={resend}
                disabled={resending}
              >
                {resending
                  ? "Sending…"
                  : "Send new verification email"}
              </button>
              {message && (
                <p className="auth-success" role="status">
                  {message}
                </p>
              )}
              {error && (
                <p className="auth-alert" role="alert">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
