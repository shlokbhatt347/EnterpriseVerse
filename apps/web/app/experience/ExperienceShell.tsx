"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { AREA_LANDING_NODE, EXPERIENCE_AREAS, EXPERIENCE_NODE_BY_ID, PRIMARY_EXPERIENCE_NAV, type ExperienceArea, type ExperienceSurface } from "./architecture";
import type { AttentionItem, ExperienceShellProps, ShellMode } from "./shell-types";
import "./shell.css";

const AREA_ICONS: Record<ExperienceArea, string> = { world: "◈", enterprise: "▣", decide: "◇", intelligence: "⌁", learn: "✦", compete: "◉", legacy: "◌" };
const MODE_LABELS: Record<ShellMode, string> = { explore: "Explore", decide: "Decide", reflect: "Reflect" };

function areaDefinition(area?: ExperienceArea) { return area ? EXPERIENCE_AREAS.find((item) => item.id === area) : undefined; }
function surfaceForPath(pathname: string): ExperienceSurface | undefined { return Object.values(EXPERIENCE_NODE_BY_ID).find((node) => node.route === pathname)?.id; }

function AttentionCenter({ items }: { items: AttentionItem[] }) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  const actionable = items.filter((item) => item.priority !== "background");
  return <div className="ev-attention-wrap">
    <button className="ev-icon-button ev-attention-button" aria-expanded={open} aria-controls="ev-attention-panel" onClick={() => setOpen((value) => !value)}><span aria-hidden="true">●</span><span className="ev-attention-count">{actionable.length}</span><span className="ev-sr-only">Open attention center</span></button>
    {open ? <div className="ev-popover" id="ev-attention-panel" role="dialog" aria-label="Attention center"><div className="ev-popover-heading"><div><span className="ev-eyebrow">Attention</span><h2>What needs you?</h2></div><button className="ev-close-button" onClick={() => setOpen(false)} aria-label="Close attention center">×</button></div><div className="ev-attention-list">{items.map((item) => <Link key={item.id} href={item.href ?? "#"} className={`ev-attention-item ev-attention-${item.priority}`} onClick={() => setOpen(false)}><span className="ev-attention-dot" aria-hidden="true" /><span><strong>{item.title}</strong>{item.description ? <small>{item.description}</small> : null}</span></Link>)}</div></div> : null}
  </div>;
}

function Navigation({ activeArea }: { activeArea?: ExperienceArea }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <>
    <button className="ev-mobile-nav-toggle" onClick={() => setMobileOpen((value) => !value)} aria-expanded={mobileOpen} aria-controls="ev-primary-nav"><span aria-hidden="true">☰</span><span>Navigate</span></button>
    <nav id="ev-primary-nav" className={`ev-nav ${mobileOpen ? "ev-nav-open" : ""}`} aria-label="Primary experience navigation"><div className="ev-nav-section"><span className="ev-nav-label">Experience</span>
      {PRIMARY_EXPERIENCE_NAV.map((area) => { const definition = areaDefinition(area)!; const active = area === activeArea; const landing = EXPERIENCE_NODE_BY_ID[AREA_LANDING_NODE[area]]; return <div key={area} className="ev-nav-group"><Link href={landing.route} className={`ev-nav-item ${active ? "ev-nav-item-active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => setMobileOpen(false)}><span className="ev-nav-icon" aria-hidden="true">{AREA_ICONS[area]}</span><span className="ev-nav-copy"><strong>{definition.label}</strong><small>{definition.description}</small></span></Link>{active ? <div className="ev-subnav">{definition.nodes.slice(0, 5).map((id) => { const node = EXPERIENCE_NODE_BY_ID[id]; return <Link key={node.id} href={node.route} onClick={() => setMobileOpen(false)}>{node.label}</Link>; })}</div> : null}</div>; })}
    </div></nav>
  </>;
}

export default function ExperienceShell({ children, context, attention = [], inspector }: ExperienceShellProps) {
  const pathname = usePathname();
  const routeSurface = useMemo(() => surfaceForPath(pathname), [pathname]);
  const routeNode = routeSurface ? EXPERIENCE_NODE_BY_ID[routeSurface] : undefined;
  const activeArea = context?.area ?? routeNode?.area;
  const activeSurface = context?.surface ?? routeSurface;
  const mode = context?.mode ?? "explore";
  const areaMeta = areaDefinition(activeArea);
  return <div className="ev-shell" data-mode={mode} data-area={activeArea ?? "none"}>
    <header className="ev-topbar"><Link className="ev-brand" href="/play" aria-label="EnterpriseVerse home"><span className="ev-brand-mark" aria-hidden="true">EV</span><span className="ev-brand-name">Enterprise<span>Verse</span></span></Link><div className="ev-world-status" aria-label="Simulation status"><span className="ev-live-dot" aria-hidden="true" /><span>WORLD LIVE</span><span className="ev-status-divider" aria-hidden="true" /><span className="ev-world-time">DAY 42</span></div><div className="ev-top-actions"><button className="ev-command-trigger" type="button" onClick={() => window.dispatchEvent(new CustomEvent("enterpriseverse:open-command-palette"))}><span>⌘</span><span>Command</span><kbd>⌘K</kbd></button><AttentionCenter items={attention} /></div></header>
    <div className="ev-context-bar"><div className="ev-breadcrumbs"><span>{areaMeta?.label ?? "EnterpriseVerse"}</span>{activeSurface ? <><span aria-hidden="true">/</span><strong>{EXPERIENCE_NODE_BY_ID[activeSurface].label}</strong></> : null}</div><div className="ev-mode-switcher" aria-label="Experience mode">{(Object.keys(MODE_LABELS) as ShellMode[]).map((value) => <span key={value} className={mode === value ? "ev-mode-active" : ""}>{MODE_LABELS[value]}</span>)}</div></div>
    <div className="ev-layout"><aside className="ev-sidebar"><Navigation activeArea={activeArea} /><div className="ev-sidebar-footer"><div className="ev-enterprise-mini"><span className="ev-mini-label">Enterprise</span><strong>NOVA</strong><span>Day 42 · Active</span></div></div></aside><main className="ev-workspace" id="experience-workspace" tabIndex={-1}>{children}</main>{inspector?.open ? <aside className="ev-inspector" aria-label="Context inspector"><div className="ev-inspector-header"><div><span className="ev-eyebrow">Context</span><h2>{inspector.title ?? "Inspector"}</h2>{inspector.subtitle ? <p>{inspector.subtitle}</p> : null}</div></div><div className="ev-inspector-content">{inspector.content}</div></aside> : null}</div>
    <footer className="ev-statusbar"><span><i className="ev-live-dot" aria-hidden="true" /> Simulation active</span><span>EnterpriseVerse Experience 3.0</span></footer>
  </div>;
}
