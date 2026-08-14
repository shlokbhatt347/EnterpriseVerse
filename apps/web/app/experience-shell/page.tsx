import ExperienceShell from "../experience/ExperienceShell";

const attention = [
  { id: "cash", priority: "critical" as const, title: "Cash runway is tightening", description: "Your current trajectory needs attention.", href: "/enterprise" },
  { id: "orbit", priority: "important" as const, title: "Orbit changed pricing", description: "Competitor pricing moved in your primary market.", href: "/competition" },
  { id: "mumbai", priority: "signal" as const, title: "Mumbai demand increased", description: "A new market signal may create an opportunity.", href: "/world" },
];

export default function ExperienceShellReferencePage() {
  return <ExperienceShell attention={attention}>
    <section style={{ maxWidth: 1040, margin: "0 auto" }}>
      <span className="ev-eyebrow">Experience 3.0 · Step 2</span>
      <h1 style={{ fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 1, letterSpacing: "-.045em", margin: "10px 0 12px" }}>Run the business. Read the world.</h1>
      <p style={{ color: "var(--ev-muted)", maxWidth: 680, lineHeight: 1.7, margin: 0 }}>The ExperienceShell is the permanent product frame for EnterpriseVerse. Routes provide the workspace; the shell owns orientation, navigation, simulation identity, attention and responsive context.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginTop: 30 }}>
        {[["Cash", "₹4.82M", "+4.2%"], ["Market share", "31%", "+2.1%"], ["People", "82", "Stable"], ["Operations", "68", "Watch"]].map(([label, value, delta]) => <article key={label} style={{ padding: 17, border: "1px solid var(--ev-line)", borderRadius: 14, background: "var(--ev-surface)" }}><span className="ev-eyebrow">{label}</span><strong style={{ display: "block", fontSize: 25, marginTop: 8 }}>{value}</strong><small style={{ color: "var(--ev-muted)" }}>{delta}</small></article>)}
      </div>
      <article style={{ marginTop: 10, padding: 22, border: "1px solid var(--ev-line)", borderRadius: 14, background: "linear-gradient(145deg,var(--ev-surface-2),var(--ev-surface))" }}>
        <span className="ev-eyebrow">Current situation</span><h2 style={{ margin: "8px 0" }}>Supplier costs increased 18%.</h2><p style={{ color: "var(--ev-muted)", lineHeight: 1.6 }}>A contextual decision surface belongs here. The shell deliberately owns navigation and context; the simulation remains the source of truth for business state.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>{["Negotiate", "Switch supplier", "Absorb cost", "Investigate"].map((action) => <button key={action} type="button" style={{ padding: "10px 13px", borderRadius: 9, border: "1px solid var(--ev-line-strong)", background: "var(--ev-surface-3)", color: "var(--ev-text)", cursor: "pointer" }}>{action}</button>)}</div>
      </article>
    </section>
  </ExperienceShell>;
}
