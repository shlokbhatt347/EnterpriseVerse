"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import "./experience-shell.css";

type NavItem = { id: string; label: string; hint: string; href: string };
export type InspectorPayload = { kind: string; title: string; value?: string; summary: string; why: string; connections: string[]; actions?: { label: string; href?: string }[] };

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

const defaultInspector: InspectorPayload = {
  kind: "SYSTEM",
  title: "Context inspector",
  summary: "Select a metric, signal, decision or object anywhere in Experience 3.0.",
  why: "The inspector keeps the current context visible without forcing you to leave the decision surface.",
  connections: ["Company state", "World state", "Decisions", "History"],
};

export function ExperienceShell({ children, active = "enterprise" }: { children: ReactNode; active?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [inspector, setInspector] = useState<InspectorPayload>(defaultInspector);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen((value) => !value); }
      if (event.key === "Escape") { setCommandOpen(false); setInspectorOpen(false); }
    };
    const onInspect = (event: Event) => {
      const payload = (event as CustomEvent<InspectorPayload>).detail;
      if (!payload) return;
      setInspector(payload);
      setInspectorOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("ev3:inspect", onInspect);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("ev3:inspect", onInspect); };
  }, []);

  const filteredCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? commandItems.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(normalized)) : commandItems;
  }, [query]);

  return (
    <div className="ev3-shell">
      <header className="ev3-topbar">
        <Link className="ev3-brand" href="/" aria-label="EnterpriseVerse home" onClick={() => setMobileOpen(false)}>
          <span className="ev3-mark">EV</span><span><strong>ENTERPRISEVERSE</strong><small>EXPERIENCE 3.0</small></span>
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
        {navItems.map((item) => <Link key={item.id} href={item.href} className={`ev3-nav-item ${active === item.id ? "active" : ""}`} title={item.hint} onClick={() => setMobileOpen(false)}><span className="ev3-nav-icon">{iconFor(item.id)}</span><span>{item.label}</span>{active === item.id && <b />}</Link>)}
        <div className="ev3-sidebar-spacer" />
        <button className="ev3-command-hint" onClick={() => setCommandOpen(true)}><span>⌘K</span><div><strong>Command Center</strong><small>Jump anywhere</small></div></button>
        <div className="ev3-world-card"><span className="ev3-nav-label">WORLD PULSE</span><div><i className="good" /> Economy <strong>Stable</strong></div><div><i className="warn" /> Supply <strong>Pressure</strong></div><div><i className="good" /> Demand <strong>Growing</strong></div></div>
      </aside>

      <main className="ev3-main">{children}</main>

      {inspectorOpen && <aside className="ev3-inspector" aria-label="Universal context inspector">
        <button className="ev3-inspector-close" onClick={() => setInspectorOpen(false)} aria-label="Close inspector">×</button>
        <span className="ev3-nav-label">{inspector.kind}</span>
        <h2>{inspector.title}</h2>
        {inspector.value && <strong className="ev3-inspector-value">{inspector.value}</strong>}
        <p className="ev3-muted">{inspector.summary}</p>
        <div className="ev3-inspect-section"><span>WHY IT MATTERS</span><p>{inspector.why}</p></div>
        <div className="ev3-inspect-section"><span>CONNECTED TO</span><div className="ev3-connection-list">{inspector.connections.map((connection) => <button key={connection} onClick={() => window.dispatchEvent(new CustomEvent("ev3:inspect", { detail: { ...defaultInspector, kind: "CONNECTION", title: connection, summary: `This relationship is connected to ${inspector.title}.`, why: "Following relationships helps you understand the system rather than isolated numbers.", connections: [inspector.title, "Company state", "World state"] } }))}>{connection}<b>→</b></button>)}</div></div>
        {inspector.actions?.length ? <div className="ev3-inspect-actions">{inspector.actions.map((action) => action.href ? <Link key={action.label} href={action.href} className="ev3-secondary">{action.label} →</Link> : <button key={action.label} className="ev3-secondary" onClick={() => setInspectorOpen(false)}>{action.label}</button>)}</div> : null}
      </aside>}

      {commandOpen && <div className="ev3-command-backdrop" role="presentation" onMouseDown={() => setCommandOpen(false)}><section className="ev3-command" role="dialog" aria-modal="true" aria-label="EnterpriseVerse command center" onMouseDown={(event) => event.stopPropagation()}>
        <div className="ev3-command-search"><span>⌘K</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search EnterpriseVerse…" aria-label="Search EnterpriseVerse" /></div>
        <div className="ev3-command-list">{filteredCommands.map((item) => <Link key={item.label} href={item.href} onClick={() => setCommandOpen(false)}><span>{item.label}</span><small>{item.hint}</small><b>→</b></Link>)}{filteredCommands.length === 0 && <div className="ev3-command-empty">No command matches “{query}”.</div>}</div>
        <footer><span>↑↓ navigate</span><span>Enter open</span><span>Esc close</span></footer>
      </section></div>}
    </div>
  );
}

function iconFor(id: string) { return ({ world: "◎", enterprise: "▦", decide: "◇", intelligence: "⌁", learn: "◈", compete: "⚔", legacy: "◷" } as Record<string, string>)[id] ?? "•"; }
