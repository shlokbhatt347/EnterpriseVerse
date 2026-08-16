"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("EnterpriseVerse application error", error);
  }, [error]);

  return (
    <main role="alert" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px 20px", background: "#07090d", color: "#f3f6fa", fontFamily: "Inter,ui-sans-serif,system-ui,sans-serif" }}>
      <section style={{ width: "min(560px,100%)", padding: 28, border: "1px solid #3b2b2f", borderRadius: 16, background: "linear-gradient(145deg,#111720,#0a0e14)", boxShadow: "0 20px 60px #0005" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <span aria-hidden="true" style={{ width: 30, height: 30, display: "grid", placeItems: "center", border: "1px solid #394352", background: "#111720", fontSize: 9, letterSpacing: ".08em", fontWeight: 800 }}>EV</span>
          <strong>Enterprise<span style={{ color: "#a7f36b" }}>Verse</span></strong>
        </div>
        <span style={{ color: "#f3bd68", fontSize: 10, letterSpacing: ".14em", fontWeight: 800 }}>RECOVERY REQUIRED</span>
        <h1 style={{ margin: "8px 0 10px", fontSize: "clamp(28px,5vw,42px)", lineHeight: 1.05, letterSpacing: "-.04em" }}>We hit an unexpected problem.</h1>
        <p style={{ color: "#8792a3", lineHeight: 1.65, margin: 0 }}>Your simulation state should remain safe. Retry the workspace first; if the problem persists, return to the EnterpriseVerse home.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 22 }}>
          <button type="button" onClick={() => reset()} style={{ border: "0", borderRadius: 9, padding: "11px 16px", background: "#f3f6fa", color: "#080b10", fontWeight: 800 }}>Try again</button>
          <Link href="/" style={{ border: "1px solid #394352", borderRadius: 9, padding: "10px 15px", color: "#f3f6fa", textDecoration: "none", fontWeight: 700 }}>Return home</Link>
        </div>
      </section>
    </main>
  );
}
