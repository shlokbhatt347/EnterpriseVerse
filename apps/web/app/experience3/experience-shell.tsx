"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import "./experience-shell.css";

type NavItem = { id: string; label: string; hint: string; href: string };

const navItems: NavItem[] = [
  { id: "world", label: "World", hint: "Markets, economy, competition", href: "/world" },
  { id: "enterprise", label: "Enterprise", hint: "Company, people, finance", href: "/experience3" },
  { id: "decide", label: "Decide", hint: "Decisions and scenarios", href: "/strategy" },
  { id: "intelligence", label: "Intelligence", hint: "Explain, forecast, experiment", href: "/intelligence" },
  { id: "learn", label: "Learn", hint: "Concepts and skills", href: "/learning" },
  { id: "compete", label: "Compete", hint: "Rivals and multiplayer", href: "/competition" },
  { id: "legacy", label: "Legacy", hint: "Timeline, replay, identity", href: "/endgame" },
];

const commandItems = [
  ...navItems.map((item) => ({ label: `Open ${item.label}`, hint: item.hint, href: item.href })),
  { label: "Open main simulator", hint: "Return to the live simulation", href: "/" },
];

export function ExperienceShell({ children, active = "enterprise" }: { children: ReactNode; active?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setInspectorOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? commandItems.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(normalized)) : commandItems;
  }, [query]);

  return (
    <div className="ev3-shell">
      <header className="ev3-topbar">
        <Link className="ev3-brand" href="/" aria-label="EnterpriseVerse home" onClick={() => setMobileOpen(false)}>
          <span className="ev3-mark">EV</span>
          <span><strong>ENTERPRISEVERSE</strong><small>EXPERIENCE 3.0</small></span>
        </Link>
        <div className="ev3-context"><span className="ev3-company">NOVA</span><span>LIVE SIMULATION</span><span className="ev3-live"><i /> WORLD ACTIVE</span></div>
        <div className="ev3-top-actions">
          <button onClick={() => setCommandOpen(true)} aria-label="Open command center" title="Command Center"><span>⌘K</span></button>
          <button onClick={() => setInspectorOpen((value) => !value)} aria-label="Toggle context inspector" title="Context inspector">◫</button>
          <button aria-label="Account">SB</button>
        </div>
      </header>

      <button className="ev3-mobile-toggle" onClick={() => setMobileOpen((value) => !value)} aria-expanded={mobileOpen}>☰ <span>Navigation</span></button>
      <aside className={`ev3-sidebar ${mobileOpen ? "open" : ""}`} aria-label="EnterpriseVerse navigation">
        <div className="ev3-nav-label">OPERATING WORLD</div>
        {navItems.map((item) => (
          <Link key={item.id} href={item.href} className={`ev3-nav-item ${active === item.id ? "active" : ""}`} title={item.hint} onClick={() => setMobileOpen(false)}>
            <span className="ev3-nav-icon">{iconFor(item.id)}</span><span>{item.label}</span>{active === item.id && <b />}
          </Link>
        ))}
        <div className="ev3-sidebar-spacer" />
        <button className="ev3-command-hint" onClick={() => setCommandOpen(true)}><span>⌘K</span><div><strong>Command Center</strong><small>Jump anywhere</small></div></button>
        <div className="ev3-world-card"><span className="ev3-nav-label">WORLD PULSE</span><div><i className="good" /> Economy <strong>Stable</strong></div><div><i className="warn" /> Supply <strong>Pressure</strong></div><div><i className="good" /> Demand <strong>Growing</strong></div></div>
      </aside>

      <main className="ev3-main">{children}</main>

      {inspectorOpen && <aside className="ev3-inspector" aria-label="Context inspector">
        <button className="ev3-inspector-close" onClick={() => setInspectorOpen(false)} aria-label="Close inspector">×</button>
        <span className="ev3-nav-label">CONTEXT</span><h2>Company pulse</h2>
        <p className="ev3-muted">Select a metric, event or decision to make this panel explain what it means and what connects to it.</p>
        <div className="ev3-inspect-block"><span>Cash runway</span><strong>Live state</strong><small>Driven by cash and operating costs</small></div>
        <div className="ev3-inspect-block"><span>Market position</span><strong>Live state</strong><small>Connected to demand and competition</small></div>
        <div className="ev3-inspect-block"><span>Reputation</span><strong>Live state</strong><small>Connected to customer and company outcomes</small></div>
        <Link className="ev3-secondary" href="/analytics">Open full analysis →</Link>
      </aside>}

      {commandOpen && <div className="ev3-command-backdrop" role="presentation" onMouseDown={() => setCommandOpen(false)}>
        <section className="ev3-command" role="dialog" aria-modal="true" aria-label="EnterpriseVerse command center" onMouseDown={(event) => event.stopPropagation()}>
          <div className="ev3-command-search"><span>⌘K</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search EnterpriseVerse…" aria-label="Search EnterpriseVerse" /></div>
          <div className="ev3-command-list">{filteredCommands.map((item) => <Link key={item.label} href={item.href} onClick={() => setCommandOpen(false)}><span>{item.label}</span><small>{item.hint}</small><b>→</b></Link>)}{filteredCommands.length === 0 && <div className="ev3-command-empty">No command matches “{query}”.</div>}</div>
          <footer><span>↑↓ navigate</span><span>Enter open</span><span>Esc close</span></footer>
        </section>
      </div>}
    </div>
  );
}

function iconFor(id: string) {
  return ({ world: "◎", enterprise: "▦", decide: "◇", intelligence: "⌁", learn: "◈", compete: "⚔", legacy: "◷" } as Record<string, string>)[id] ?? "•";
}
