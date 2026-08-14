"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "./auth-provider";

export default function AccountMenu() {
  const { user, mode, authReady, signOut } = useAccount();
  const [open, setOpen] = useState(false);

  if (!authReady || !user || mode === "loading") return <div className="account-wrap"><div className="account-chip loading" aria-live="polite">Loading account…</div></div>;

  if (mode === "guest") {
    return (
      <nav className="account-wrap auth-actions" aria-label="Account actions">
        <Link className="auth-link login" href="/auth/signin">Log In</Link>
        <Link className="auth-link signup" href="/auth/signup">Sign Up</Link>
      </nav>
    );
  }

  const close = () => setOpen(false);

  return (
    <div className="account-wrap">
      <button type="button" className="account-chip" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" aria-label="Open account menu">
        <span className="account-avatar" aria-hidden="true">{user.displayName.slice(0, 1).toUpperCase()}</span>
        <span><strong>{user.displayName}</strong><small>{user.email ?? "Email account"}</small></span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && <div className="account-popover" role="menu">
        <div className="account-heading"><strong>{user.displayName}</strong><span>{user.email ?? "Email account"}</span></div>
        <Link className="account-action primary" href="/account" onClick={close}>Profile & settings</Link>
        <Link className="account-action" href="/" onClick={close}>Executive home</Link>
        <Link className="account-action" href="/company" onClick={close}>Company workspace</Link>
        <Link className="account-action" href="/career" onClick={close}>Career & opportunities</Link>
        <Link className="account-action" href="/world" onClick={close}>Executive world</Link>
        <Link className="account-action" href="/strategy" onClick={close}>Strategy</Link>
        <Link className="account-action" href="/intelligence" onClick={close}>Enterprise intelligence</Link>
        <Link className="account-action" href="/learning" onClick={close}>Founder learning</Link>
        <Link className="account-action" href="/competition" onClick={close}>Competition</Link>
        <Link className="account-action" href="/endgame" onClick={close}>Legacy & endgame</Link>
        <Link className="account-action" href="/enterprise" onClick={close}>Build or join a business</Link>
        <button type="button" className="account-action" onClick={async () => { await signOut(); close(); }}>Log out</button>
      </div>}
    </div>
  );
}
