"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { calculateKpis } from "@enterpriseverse/simulation";
import type { SimulationState } from "@enterpriseverse/types";
import "./canonical-shell.css";

const nav = [
  ["WORLD", "/world", "What is happening outside?"] as const,
  ["ENTERPRISE", "/day1", "What is happening inside?"] as const,
  ["DECIDE", "/day1#decision", "What should I do?"] as const,
  ["INTELLIGENCE", "/intelligence", "Why is this happening?"] as const,
  ["LEARN", "/learning", "What did this teach me?"] as const,
  ["COMPETE", "/competition", "How am I performing?"] as const,
  ["LEGACY", "/endgame", "What did I build?"] as const,
];

function money(value: number) { return `₹${Math.round(value).toLocaleString("en-IN")}`; }

type SyncStatus = "loading" | "ready" | "saving" | "error";

export default function CanonicalShell({ state, syncStatus = "ready", children }: { state: SimulationState; syncStatus?: SyncStatus; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const kpis = calculateKpis(state);
  const event = state.events?.[0];
  const actionable = event ? 1 : kpis.cashRunwayDays < 14 ? 1 : 0;
  const active = (href: string) => href === "/day1" ? pathname === "/day1" : pathname.startsWith(href);
  const syncLabel = syncStatus === "saving" ? "Saving…" : syncStatus === "error" ? "Local save preserved" : syncStatus === "loading" ? "Loading…" : "Saved";
  const syncClass = syncStatus === "error" ? "status-warn" : "status-good";

  return <div className="ev-canonical-shell">
    <header className="ev-canonical-topbar">
      <Link href="/" className="ev-canonical-brand" aria-label="EnterpriseVerse home"><span className="ev-brand-mark" aria-hidden="true">EV</span><span>Enterprise<span>Verse</span></span></Link>
      <div className="ev-world-state" aria-label={`Simulation day ${state.business.day}`}><span className="ev-live-pulse" aria-hidden="true" /><span>WORLD LIVE</span><b>DAY {state.business.day}</b></div>
      <div className="ev-top-metrics"><span><small>CASH</small><b>{money(state.business.cash)}</b></span><span><small>REPUTATION</small><b>{Math.round(state.business.reputation)}</b></span><button type="button" className="ev-attention-trigger" aria-label={`${actionable} item needing attention`} onClick={() => document.getElementById("ev-attention")?.scrollIntoView({ behavior: "smooth", block: "start" })}><small>ATTENTION</small><b>{actionable}</b></button></div>
      <button type="button" className="ev-mobile-toggle" aria-expanded={mobileOpen} aria-controls="ev-canonical-nav" onClick={() => setMobileOpen((v) => !v)}>Menu</button>
    </header>
    <div className="ev-canonical-body">
      <aside id="ev-canonical-nav" className={`ev-canonical-nav ${mobileOpen ? "open" : ""}`} aria-label="EnterpriseVerse navigation">
        <div className="ev-enterprise-summary"><span>ENTERPRISE</span><strong>{state.business.name}</strong><small>{state.business.industry} · Day {state.business.day}</small></div>
        <nav>{nav.map(([label, href, description]) => <Link key={label} href={href} className={active(href) ? "active" : ""} onClick={() => setMobileOpen(false)}><span className="ev-nav-label">{label}</span><small>{description}</small></Link>)}</nav>
        <div className="ev-nav-footer"><span className={syncClass} /> {syncLabel}</div>
      </aside>
      <main className="ev-canonical-main" id="simulation-workspace">{children}</main>
    </div>
  </div>;
}
