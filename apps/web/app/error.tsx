"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("EnterpriseVerse application error", error);
  }, [error]);

  return (
    <main role="alert" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <section style={{ maxWidth: 560, textAlign: "center" }}>
        <p>EnterpriseVerse</p>
        <h1>We hit an unexpected problem.</h1>
        <p>Your simulation data should remain safe. Try the action again.</p>
        <button type="button" onClick={() => reset()}>Try again</button>
      </section>
    </main>
  );
}
