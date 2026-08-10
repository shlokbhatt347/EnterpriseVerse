"use client";

import { useState } from "react";
import { useAccount } from "./auth-provider";

export default function AccountMenu() {
  const { user, mode, authReady, signOut } = useAccount();
  const [open, setOpen] = useState(false);

  if (!authReady || !user || mode === "loading") return <div className="account-chip loading">Loading account…</div>;
  return (
    <div className="account-wrap">
      <button type="button" className="account-chip" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu">
        <span className="account-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span>
        <span><strong>{user.displayName}</strong><small>{mode === "email" ? user.email ?? "Email account" : "Guest · local save"}</small></span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && <div className="account-popover" role="menu">
        <div className="account-heading"><strong>{user.displayName}</strong><span>{user.email ?? "Progress is saved locally on this device."}</span></div>
        {mode === "guest" ? <>
          <a className="account-action primary" href="/auth/signin" onClick={() => setOpen(false)}>Sign in / create account</a>
          <a className="account-action" href="/auth/signup" onClick={() => setOpen(false)}>Create free account</a>
        </> : <>
          <a className="account-action" href="/account" onClick={() => setOpen(false)}>Account settings</a>
          <button type="button" className="account-action" onClick={async () => { await signOut(); setOpen(false); }}>Sign out</button>
        </>}
      </div>}
    </div>
  );
}
