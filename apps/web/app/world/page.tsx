"use client";

import { useEffect, useMemo, useState } from "react";
import type { SimulationChoice, SimulationState } from "@enterpriseverse/types";
import { advanceLivingWorldDay, getLivingWorldSummary, negotiateWithSupplier, resolveLivingWorldChoice } from "@enterpriseverse/simulation";
import "./world.css";

const SAVE_KEY = "enterpriseverse:active-business:v1";
const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

export default function WorldPage() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => { try { const raw = window.localStorage.getItem(SAVE_KEY); if (raw) setState(JSON.parse(raw) as SimulationState); } catch { window.localStorage.removeItem(SAVE_KEY); } }, []);
  useEffect(() => { if (state) window.localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }, [state]);
  const world = useMemo(() => state ? getLivingWorldSummary(state) : null, [state]);
  const event = state ? state.events?.[0] : null;
  const negotiation = useMemo(() => state ? negotiateWithSupplier(state) : null, [state]);

  if (!state || !world) return <main className="world-shell"><section className="world-empty"><span>ENTERPRISEVERSE · WORLD</span><h1>Enter the living world.</h1><p>Create a company in the simulator first. Your saved business will appear here automatically.</p><a href="/EnterpriseVerse/play/">Open Founder Mode →</a></section></main>;

  const choose = (choice: SimulationChoice) => { setSelected(choice.id); setState((current) => current ? resolveLivingWorldChoice(current, choice) : current); setMessage("World decision resolved. The consequences are now part of your business state."); };
  const advance = () => { setSelected(null); setState((current) => current ? advanceLivingWorldDay(current) : current); setMessage("A new day has unfolded. Customers, competitors, scenarios and the economy have reacted."); };
  return <main className="world-shell">
    <header className="world-header"><a href="/EnterpriseVerse/" className="world-brand">ENTERPRISEVERSE</a><div>DAY {state.business.day} · {state.business.name}</div><strong>{money(state.business.cash)}</strong></header>
    <div className="world-layout">
      <section className="world-main">
        <div className="world-title"><div><span>THE LIVING ENTERPRISEVERSE</span><h1>The market is watching.</h1><p>Your decisions change the world. The world changes your next decision.</p></div><a href="/EnterpriseVerse/play/">Founder Mode →</a></div>
        <div className="world-metrics"><article><span>ECONOMY</span><strong>{world.economy.toUpperCase()}</strong></article><article><span>DEMAND</span><strong>{Math.round(world.demand)}/100</strong></article><article><span>CONFIDENCE</span><strong>{Math.round(world.confidence)}/100</strong></article><article><span>COMPETITIVE PRESSURE</span><strong>{Math.round(world.competitivePressure)}/100</strong></article></div>
        <section className="world-card"><div className="card-label">WORLD EVENT</div><h2>{event?.title ?? "The world is stable"}</h2><p>{event?.message ?? "Advance the day to let the economy and agents create new conditions."}</p>{event?.choices?.length ? <div className="world-choices">{event.choices.map((choice) => <button key={choice.id} className={selected === choice.id ? "selected" : ""} onClick={() => choose(choice)}><b>{choice.label}</b><small>{Object.entries(choice.effects).slice(0, 3).map(([key, value]) => `${key} ${value >= 0 ? "+" : ""}${value}`).join(" · ")}</small></button>)}</div> : null}</section>
        {negotiation ? <section className="world-card negotiation"><div><div className="card-label">SUPPLIER NEGOTIATION</div><h2>{negotiation.title}</h2><p>{negotiation.message}</p></div><button onClick={() => choose(negotiation.choice)}>{negotiation.choice.label}</button></section> : null}
        <section className="world-card"><div className="card-label">ACTIVE SCENARIOS</div>{world.activeScenarios.length ? <div className="scenario-list">{world.activeScenarios.map((scenario) => <span key={scenario}>⚡ {scenario}</span>)}</div> : <p>No active macro shock. The market can change at any time.</p>}</section>
        <section className="world-card"><div className="card-label">LATEST AGENT REACTIONS</div><div className="reaction-list">{world.latestReactions.length ? world.latestReactions.map((reaction, index) => <article key={`${reaction.agentId}-${index}`}><b>{reaction.agentId}</b><span>{reaction.action}</span><p>{reaction.rationale}</p></article>) : <p>No agent reactions yet. Advance the day.</p>}</div></section>
        <div className="world-footer"><span role="status" aria-live="polite">{message}</span><button className="advance" onClick={advance} disabled={Boolean(event?.choices?.length && !selected)}>Advance Day →</button></div>
      </section>
      <aside className="competitors"><div className="card-label">MARKET LEADERS</div><h2>Your competitors</h2>{world.competitorLeaders.map((competitor, index) => <article key={competitor.name}><div className="rank">{index + 1}</div><div><b>{competitor.name}</b><span>{competitor.strategy} strategy</span></div><strong>{competitor.marketShare.toFixed(1)}%</strong></article>)}</aside>
    </div>
  </main>;
}
