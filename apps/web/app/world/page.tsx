"use client";

import { useMemo, useState } from "react";
import type { SimulationChoice } from "@enterpriseverse/types";
import { getPhase4CommandCenter } from "@enterpriseverse/simulation";
import CanonicalShell from "../experience/CanonicalShell";
import { useSimulation } from "../lib/simulation/useSimulation";
import "./world.css";
import "./experience-phase2.css";

const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
const pct = (value: number) => `${Math.round(value)}/100`;
const sign = (value: number) => `${value >= 0 ? "+" : ""}${Math.round(value)}`;

function severityClass(severity: string) {
  return severity === "critical" ? "critical" : severity === "watch" ? "watch" : "info";
}

export default function WorldPage() {
  const { state, status, error, commitChoice, endDay } = useSimulation();
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const currentEvent = state?.events?.[0] ?? null;
  const model = useMemo(() => (state ? getPhase4CommandCenter(state, currentEvent?.choices ?? []) : null), [state, currentEvent]);

  if (!state || !model) {
    return <main className="world-shell"><section className="world-empty"><span className="eyebrow">ENTERPRISEVERSE · EXECUTIVE COMMAND</span><h1>{status === "error" ? "Your enterprise could not be loaded." : "Loading your enterprise…"}</h1><p>{error ?? "Your live enterprise state is being connected to the canonical experience."}</p><a href="/founder">Open Founder Mode →</a></section></main>;
  }

  const choose = async (choice: SimulationChoice) => {
    setBusy(true); setSelected(choice.id); setMessage("Committing decision to the canonical simulation state…");
    const next = await commitChoice(choice);
    setMessage(next ? "Decision committed. The enterprise state is now updated across the experience." : "The decision could not be committed."); setBusy(false);
  };

  const advance = async () => {
    setBusy(true); setSelected(null); setMessage("");
    const next = await endDay();
    setMessage(next ? "A new business day has unfolded across the same canonical enterprise state." : "The day could not be advanced."); setBusy(false);
  };

  return <CanonicalShell state={state} syncStatus={status}>
    <main className="world-shell"><div className="world-command-shell">
      <section className="command-hero"><div><span className="eyebrow">{state.business.industry} · LIVE ENTERPRISE</span><h1>{model.briefing.headline}</h1><p>{model.briefing.situation}</p><small>{model.briefing.why}</small></div><div className="hero-health"><span>COMPANY HEALTH</span><strong>{Math.round(model.briefing.health.overall)}</strong><small>{model.briefing.health.risk >= 60 ? "Risk elevated" : "Operating normally"}</small></div></section>
      <section className="kpi-strip" aria-label="Company key performance indicators"><article><span>REVENUE</span><strong>{money(state.business.revenue)}</strong><small>Lifetime simulated sales</small></article><article><span>CASH</span><strong>{money(state.business.cash)}</strong><small>{model.briefing.health.financial}/100 financial health</small></article><article><span>MARKET SHARE</span><strong>{state.business.marketShare.toFixed(1)}%</strong><small>{model.briefing.market.competitivePressure}/100 pressure</small></article><article><span>REPUTATION</span><strong>{Math.round(state.business.reputation)}</strong><small>{model.briefing.health.customers}/100 customer health</small></article><article><span>WORKFORCE</span><strong>{model.briefing.health.workforce}</strong><small>{state.workforce?.employees.length ?? 0} employees tracked</small></article></section>
      <div className="command-grid"><section className="attention-panel" id="ev-attention"><div className="section-title"><div><span className="eyebrow">01 · ATTENTION CENTER</span><h2>What needs you now</h2></div><span>{model.briefing.attention.length} signals</span></div>{model.briefing.attention.length ? model.briefing.attention.map((item) => <article className={`attention-row ${severityClass(item.severity)}`} key={item.id}><div className="signal-dot" /><div><strong>{item.title}</strong><p>{item.reason}</p><small>{item.action}</small></div>{item.metric ? <b>{item.metric}</b> : null}</article>) : <div className="empty-panel"><strong>Nothing critical.</strong><p>No constraint currently requires urgent executive intervention.</p></div>}</section><section className="market-panel"><div className="section-title"><div><span className="eyebrow">02 · MARKET PULSE</span><h2>{model.briefing.market.economy.toUpperCase()}</h2></div><span>{model.briefing.market.trend}</span></div><div className="pulse-grid"><div><span>Demand</span><strong>{pct(model.briefing.market.demand)}</strong><i style={{ width: `${model.briefing.market.demand}%` }} /></div><div><span>Confidence</span><strong>{pct(model.briefing.market.confidence)}</strong><i style={{ width: `${model.briefing.market.confidence}%` }} /></div><div><span>Competition</span><strong>{pct(model.briefing.market.competitivePressure)}</strong><i style={{ width: `${model.briefing.market.competitivePressure}%` }} /></div></div><div className="market-brief"><b>Executive read</b><p>{model.briefing.why}</p></div></section></div>
      <div className="command-grid wide"><section className="decision-panel"><div className="section-title"><div><span className="eyebrow">03 · DECISION ROOM</span><h2>{currentEvent?.title ?? "No decision waiting"}</h2></div><span>{currentEvent ? `Day ${currentEvent.day}` : "Standby"}</span></div><p className="decision-message">{currentEvent?.message ?? "Advance the enterprise day to let the living world generate a new condition."}</p>{currentEvent?.choices?.length ? <div className="decision-grid">{currentEvent.choices.map((choice) => { const preview = model.previews.find((item) => item.choiceId === choice.id); return <button className={`decision-card ${selected === choice.id ? "selected" : ""}`} key={choice.id} onClick={() => void choose(choice)} disabled={busy}><strong>{choice.label}</strong>{preview ? <div className="preview-row"><span>Cash <b>{sign(preview.projected.cashDelta)}</b></span><span>Revenue <b>{sign(preview.projected.revenueDelta)}</b></span><span>Health <b>{sign(preview.projected.healthDelta)}</b></span><span>Risk <b>{sign(preview.projected.riskDelta)}</b></span></div> : null}</button>; })}</div> : null}</section><aside className="priority-panel"><div className="section-title"><div><span className="eyebrow">04 · EXECUTIVE PRIORITIES</span><h2>This period</h2></div></div><div className="priority-list">{model.briefing.priorities.map((priority, index) => <div key={priority.title}><span>0{index + 1}</span><div><strong>{priority.title}</strong><p>{priority.detail}</p></div></div>)}</div></aside></div>
      <div className="command-grid"><section className="company-panel"><div className="section-title"><div><span className="eyebrow">05 · BUSINESS HEALTH</span><h2>Departments</h2></div></div>{([['Financial', model.briefing.health.financial], ['Customers', model.briefing.health.customers], ['Operations', model.briefing.health.operations], ['Workforce', model.briefing.health.workforce], ['Reputation', model.briefing.health.reputation], ['Innovation', model.briefing.health.innovation]] as Array<[string, number]>).map(([label, value]) => <div className="health-row" key={label}><span>{label}</span><div><i style={{ width: `${value}%` }} /></div><strong>{Math.round(value)}</strong></div>)}</section><section className="company-panel"><div className="section-title"><div><span className="eyebrow">06 · COMPETITIVE INTELLIGENCE</span><h2>Market leaders</h2></div><a href="/competition">Compete →</a></div>{model.competitors.map((competitor, index) => <div className="competitor-row" key={competitor.name}><span className="rank">{index + 1}</span><div><strong>{competitor.name}</strong><small>{competitor.strategy} · aggression {Math.round(competitor.aggression)}</small></div><b>{competitor.marketShare.toFixed(1)}%</b></div>)}</section></div>
      <section className="company-panel news-panel"><div className="section-title"><div><span className="eyebrow">07 · WORLD FEED</span><h2>What changed around you</h2></div><span>{model.activeScenarios.length ? `${model.activeScenarios.length} active scenarios` : "No macro shock"}</span></div>{model.recentEvents.map((event) => <article className="news-row" key={`${event.day}-${event.title}`}><span>DAY {event.day}</span><div><strong>{event.title}</strong><p>{event.message}</p></div></article>)}</section>
      <footer className="world-footer"><span role="status" aria-live="polite">{message}</span><button className="advance" onClick={() => void advance()} disabled={busy || Boolean(currentEvent?.choices?.length && !selected)}>{busy ? "Updating…" : "Advance Day →"}</button></footer>
    </div></main>
  </CanonicalShell>;
}
