export default function Loading() {
  return (
    <main aria-busy="true" aria-live="polite" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px 20px", background: "#07090d", color: "#f3f6fa", fontFamily: "Inter,ui-sans-serif,system-ui,sans-serif" }}>
      <section role="status" style={{ width: "min(420px,100%)", padding: 24, border: "1px solid #202733", borderRadius: 16, background: "linear-gradient(145deg,#111720,#0a0e14)", boxShadow: "0 20px 60px #0005" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span aria-hidden="true" style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid #394352", background: "#111720", fontSize: 9, letterSpacing: ".08em", fontWeight: 800 }}>EV</span>
          <strong style={{ letterSpacing: "-.03em" }}>Enterprise<span style={{ color: "#a7f36b" }}>Verse</span></strong>
        </div>
        <div style={{ height: 4, borderRadius: 999, background: "#202733", overflow: "hidden", marginBottom: 16 }}><div style={{ width: "42%", height: "100%", background: "#a7f36b" }} /></div>
        <p style={{ margin: 0, color: "#f3f6fa", fontWeight: 700 }}>Loading your enterprise</p>
        <p style={{ margin: "6px 0 0", color: "#7f8a99", fontSize: 12, lineHeight: 1.5 }}>Restoring the simulation context and preparing your workspace.</p>
      </section>
    </main>
  );
}
