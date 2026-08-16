import Link from "next/link";

export default function NotFound() {
  return (
    <main role="main" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px 20px", background: "#07090d", color: "#f3f6fa", fontFamily: "Inter,ui-sans-serif,system-ui,sans-serif" }}>
      <section style={{ width: "min(560px,100%)", padding: 28, border: "1px solid #202733", borderRadius: 16, background: "linear-gradient(145deg,#111720,#0a0e14)", boxShadow: "0 20px 60px #0005" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <span aria-hidden="true" style={{ width: 30, height: 30, display: "grid", placeItems: "center", border: "1px solid #394352", background: "#111720", fontSize: 9, letterSpacing: ".08em", fontWeight: 800 }}>EV</span>
          <strong>Enterprise<span style={{ color: "#a7f36b" }}>Verse</span></strong>
        </div>
        <span style={{ color: "#a7f36b", fontSize: 10, letterSpacing: ".14em", fontWeight: 800 }}>ROUTE NOT FOUND</span>
        <h1 style={{ margin: "8px 0 10px", fontSize: "clamp(34px,6vw,52px)", lineHeight: 1, letterSpacing: "-.05em" }}>This workspace doesn't exist.</h1>
        <p style={{ color: "#8792a3", lineHeight: 1.65, margin: 0 }}>The requested EnterpriseVerse route is unavailable or has moved. Your simulation is not affected.</p>
        <div style={{ marginTop: 22 }}>
          <Link href="/" style={{ display: "inline-flex", borderRadius: 9, padding: "11px 16px", background: "#f3f6fa", color: "#080b10", textDecoration: "none", fontWeight: 800 }}>Return to EnterpriseVerse</Link>
        </div>
      </section>
    </main>
  );
}
