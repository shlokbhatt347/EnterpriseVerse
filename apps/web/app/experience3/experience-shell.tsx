"use client";

import { ReactNode, useState } from "react";
import "./experience-shell.css";

type NavItem = { id: string; label: string; hint: string };

const navItems: NavItem[] = [
  { id: "world", label: "World", hint: "Markets, economy, competition" },
  { id: "enterprise", label: "Enterprise", hint: "Company, people, finance" },
  { id: "decide", label: "Decide", hint: "Decisions and scenarios" },
  { id: "intelligence", label: "Intelligence", hint: "Explain, forecast, experiment" },
  { id: "learn", label: "Learn", hint: "Concepts and skills" },
  { id: "compete", label: "Compete", hint: "Rivals and multiplayer" },
  { id: "legacy", label: "Legacy", hint: "Timeline, replay, identity" },
];

export function ExperienceShell({ children, active = "enterprise" }: { children: ReactNode; active?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  return (
    <div className="ev3-shell">
      <header className="ev3-topbar">
        <button className="ev3-brand" onClick={() => setMobileOpen(false)} aria-label="EnterpriseVerse home">
          <span className="ev3-mark">EV</span>
          <span><strong>ENTERPRISEVERSE</strong><small>EXPERIENCE 3.0</small></span>
        </button>
        <div className="ev3-context"><span className="ev3-company">NOVA</span><span>DAY 42</span><span className="ev3-live"><i /> WORLD LIVE</span></div>
        <div className="ev3-top-actions"><button aria-label="Open command center" title="Command Center">⌘K</button><button onClick={() => setInspectorOpen((value) => !value)} aria-label="Toggle inspector">◫</button><button aria-label="Account">SB</button></div>
      </header>

      <button className="ev3-mobile-toggle" onClick={() => setMobileOpen((value) => !value)} aria-expanded={mobileOpen}>☰ <span>Navigation</span></button>
      <aside className={`ev3-sidebar ${mobileOpen ? "open" : ""}`} aria-label="EnterpriseVerse navigation">
        <div className="ev3-nav-label">OPERATING WORLD</div>
        {navItems.map((item) => <button key={item.id} className={`ev3-nav-item ${active === item.id ? "active" : ""}`} title={item.hint} onClick={() => setMobileOpen(false)}><span className="ev3-nav-icon">{iconFor(item.id)}</span><span>{item.label}</span>{active === item.id && <b />}</button>)}
        <div className="ev3-sidebar-spacer" />
        <div className="ev3-world-card"><span className="ev3-nav-label">WORLD PULSE</span><div><i className="good" /> Economy <strong>Stable</strong></div><div><i className="warn" /> Supply <strong>Pressure</strong></div><div><i className="good" /> Demand <strong>Growing</strong></div></div>
      </aside>

      <main className="ev3-main">{children}</main>

      {inspectorOpen && <aside className="ev3-inspector" aria-label="Context inspector"><button className="ev3-inspector-close" onClick={() => setInspectorOpen(false)}>×</button><span className="ev3-nav-label">CONTEXT</span><h2>Company pulse</h2><p className="ev3-muted">The inspector is a persistent place for understanding whatever the player selects.</p><div className="ev3-inspect-block"><span>Cash runway</span><strong>28 days</strong><small>Healthy buffer</small></div><div className="ev3-inspect-block"><span>Market position</span><strong>31.4%</strong><small>+2.1% this cycle</small></div><div className="ev3-inspect-block"><span>Reputation</span><strong>82 / 100</strong><small>Strong trust position</small></div><button className="ev3-secondary">Trace causes →</button></aside>}
    </div>
  );
}

function iconFor(id: string) {
  return ({ world: "◎", enterprise: "▦", decide: "◇", intelligence: "⌁", learn: "◈", compete: "⚔", legacy: "◷" } as Record<string, string>)[id] ?? "•";
}
