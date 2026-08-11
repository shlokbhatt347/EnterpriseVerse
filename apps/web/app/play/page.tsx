"use client";

import { useEffect, useMemo, useState } from "react";
import { advanceDay, applyChoice, buildDecisionDebrief, getCoachInsight, getFounderProgress } from "@enterpriseverse/simulation";
import type { SimulationChoice, SimulationState } from "@enterpriseverse/types";
import { DecisionExperience, type DecisionOption } from "../decision-experience";
import "./play.css";

const SAVE_KEY = "enterpriseverse:active-business:v1";
const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
const skillLabels = { strategy: "Strategy", finance: "Finance", marketing: "Marketing", operations: "Operations", leadership: "Leadership", risk: "Risk" } as const;

type Tab = "overview" | "world" | "founder";

function Delta({ label, before, after, format = "number" }: { label: string; before: number; after: number; format?: "number" | "money" | "percent" }) {
  const delta = after - before;
  const display = format === "money" ? money(Math.abs(delta)) : format === "percent" ? `${Math.abs(delta).toFixed(1)}%` : Math.abs(delta).toFixed(1);
  return <span className={delta >= 0 ? "p27-delta positive" : "p27-delta negative"}><small>{label}</small><b>{delta >= 0 ? "↑" : "↓"} {display}</b></span>;
}

function WhatIf({ state, choice, onApply }: { state: SimulationState; choice: SimulationChoice; onApply: (choice: SimulationChoice) => void }) {
  const [open, setOpen] = useState(false);
  const preview = useMemo(() => applyChoice(state, choice), [state, choice]);
  return <section className="p27-whatif">
    <button type="button" className="p27-whatif-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
      <span><b>↗ What if?</b><small>Preview this decision before committing</small></span><span aria-hidden="true">{open ? "−" : "+"}</span>
    </button>
    {open ? <div className="p27-whatif-panel">
      <div className="p27-preview-grid">
        <Delta label="Cash" before={state.business.cash} after={preview.business.cash} format="money" />
        <Delta label="Revenue" before={state.business.revenue} after={preview.business.revenue} format="money" />
        <Delta label="Market share" before={state.business.marketShare} after={preview.business.marketShare} format="percent" />
        <Delta label="Reputation" before={state.business.reputation} after={preview.business.reputation} />
      </div>
      <div className="p27-whatif-actions"><span>This is a preview only. Your company changes only when you commit.</span><button type="button" className="primary" onClick={() => onApply(choice)}>Apply this decision →</button></div>
    </div> : null}
  </section>;
}

export default function PlayPage() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [showCoach, setShowCoach] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (raw) setState(JSON.parse(raw) as SimulationState);
    } catch { window.localStorage.removeItem(SAVE_KEY); }
  }, []);
  useEffect(() => { if (state) window.localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }, [state]);

  const progress = useMemo(() => state ? getFounderProgress(state) : null, [state]);
  const coach = useMemo(() => state ? getCoachInsight(state) : null, [state]);
  const event = state?.events?.[0];
  const chosen = event?.choices.find((choice) => choice.id === selected);
  const debrief = chosen && state ? buildDecisionDebrief(state, chosen) : null;
  const decisionOptions = useMemo<DecisionOption[]>(() => event?.choices.map((choice) => ({
    id: choice.id,
    title: choice.label,
    description: "Commit this strategic move and let the simulation calculate the consequences.",
    risk: Object.values(choice.effects).some((value) => value < -10) ? "high" : Object.values(choice.effects).some((value) => value < 0) ? "medium" : "low",
    impacts: Object.entries(choice.effects).slice(0, 4).map(([label, value]) => ({ label, value: `${value >= 0 ? "+" : ""}${value}`, tone: value >= 0 ? "positive" : "negative" })),
  })) ?? [], [event]);

  if (!state || !progress || !coach) return <main className="play-shell"><section className="empty-play"><span className="play-kicker">ENTERPRISEVERSE · FOUNDER MODE</span><h1>Start your first enterprise.</h1><p>Create a business on the main simulator first. Your saved company will automatically appear here.</p><a className="play-primary" href="/EnterpriseVerse/">Open simulator →</a></section></main>;

  const commit = (choice: SimulationChoice) => { setSelected(choice.id); setMessage("Decision locked. The next move is yours."); setState((current) => current ? applyChoice(current, choice) : current); };
  const endDay = () => { setSelected(null); setMessage("Day advanced. Customers, competitors and the market have reacted."); setState((current) => current ? advanceDay(current) : current); };

  return <main className="play-shell">
    <header className="play-topbar">
      <a href="/EnterpriseVerse/" className="play-brand">ENTERPRISEVERSE</a>
      <div className="play-day"><span className="live-dot" aria-hidden="true" /> DAY {state.business.day}<span>·</span>{state.business.name}</div>
      <div className="play-cash">{money(state.business.cash)}</div>
    </header>
    <nav className="p27-mobile-tabs" aria-label="Founder navigation">
      {(["overview", "world", "founder"] as Tab[]).map((item) => <button key={item} type="button" className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item === "overview" ? "⌂ Command" : item === "world" ? "◈ World" : "◉ Founder"}</button>)}
    </nav>
    <div className="play-grid">
      <aside className={`play-sidebar ${tab === "founder" ? "p27-mobile-visible" : ""}`}>
        <div className="play-profile"><div className="avatar">{state.business.founders[0]?.name.slice(0, 1).toUpperCase() ?? "F"}</div><div><strong>{state.business.founders[0]?.name ?? "Founder"}</strong><span>Founder · Level {progress.level}</span></div></div>
        <div className="play-section-label">FOUNDER SKILLS</div>
        {(Object.entries(progress.skills) as [keyof typeof skillLabels, number][]).map(([key, value]) => <div className="skill-row" key={key}><div><span>{skillLabels[key]}</span><b>{value}</b></div><div className="skill-track"><i style={{ width: `${value}%` }} /></div></div>)}
        <div className="play-section-label">PROGRESS</div><div className="xp-row"><span>{progress.xp} XP</span><span>{progress.xpToNextLevel} XP</span></div><div className="xp-track"><i style={{ width: `${Math.min(100, (progress.xp / progress.xpToNextLevel) * 100)}%` }} /></div>
      </aside>
      <section className={`play-main ${tab === "world" ? "p27-world-focus" : ""}`}>
        <div className="play-hero"><div><span className="play-kicker">{state.business.industry} · COMMAND CENTER</span><h1>{state.business.name}</h1><p>{state.business.idea}</p></div><div className={`health ${progress.health}`}><span className="health-dot" />{progress.health.toUpperCase()}</div></div>
        <section className="p27-attention-card" aria-label="Current business situation"><div><span className="play-kicker">WHAT NEEDS YOUR ATTENTION</span><h2>{event ? event.title : "Your next business move"}</h2><p>{event ? event.message : "The day is complete. Advance the simulation to reveal what the market does next."}</p></div><span className="p27-attention-badge">{event ? "ACTION" : "READY"}</span></section>
        <div className="metric-grid p27-metric-grid"><div><span>CASH</span><strong>{money(state.business.cash)}</strong><small>Available now</small></div><div><span>REVENUE</span><strong>{money(state.business.revenue)}</strong><small>Current business</small></div><div><span>MARKET SHARE</span><strong>{state.business.marketShare.toFixed(1)}%</strong><small>Competitive position</small></div><div><span>REPUTATION</span><strong>{Math.round(state.business.reputation)}/100</strong><small>Customer trust</small></div></div>

        {showCoach ? <section className={`coach coach-${coach.priority} p27-coach`}><div className="coach-icon">✦</div><div><span>FOUNDER COACH · {skillLabels[coach.skill].toUpperCase()}</span><h2>{coach.headline}</h2><p>{coach.explanation}</p><strong>Try this: {coach.action}</strong></div><button type="button" className="p27-dismiss" onClick={() => setShowCoach(false)} aria-label="Dismiss coach">×</button></section> : <button type="button" className="p27-coach-return" onClick={() => setShowCoach(true)}>✦ Show Founder Coach</button>}

        {event ? <section className="decision-card p27-decision-card"><DecisionExperience situation={event.title} context={<><p>{event.message}</p><span className="p27-decision-meta">DAY {event.day} · {event.choices.length} STRATEGIC OPTIONS</span></>} options={decisionOptions} onConfirm={(option) => { const choice = event.choices.find((item) => item.id === option.id); if (choice) commit(choice); }} consequence={debrief ? <div className="p27-consequence-grid"><div><span>DECISION QUALITY</span><strong>{debrief.score}/100</strong></div><div><span>CONSEQUENCE</span><p>{debrief.consequence}</p></div><div><span>LESSON</span><p>{debrief.lesson}</p></div></div> : null} />{chosen ? <WhatIf state={state} choice={chosen} onApply={commit} /> : null}</section> : <section className="complete-card p27-complete"><span className="play-kicker">DAY COMPLETE</span><h2>Your decisions are now in the world.</h2><p>Advance the simulation to let customers, competitors, the market and your operations respond.</p><button type="button" className="play-primary" onClick={endDay}>Advance to the next day →</button></section>}

        <div className="play-actions"><span role="status" aria-live="polite">{message}</span><button type="button" className="play-primary" onClick={endDay} disabled={Boolean(event && !selected)}>End Day & See What Happens →</button></div>

        <section className="p27-learning-card"><div className="p27-learning-icon">✦</div><div><span className="play-kicker">LEARN THROUGH PLAY</span><h3>{debrief?.lesson ?? "Every business decision has a trade-off."}</h3><p>{debrief ? "Your result is calculated from the same simulation state that drives your company. Use the outcome to refine your next decision." : "Watch how price, demand, cash, reputation and competition interact as you build your company."}</p></div><a href="/EnterpriseVerse/learning">Explore learning →</a></section>

        <section className="milestones"><div className="section-title"><span>FOUNDER JOURNEY</span><strong>Your next milestones</strong></div><div className="milestone-grid">{progress.milestones.map((item) => <article key={item.id} className={`milestone ${item.status}`}><div className="milestone-top"><span>{item.status === "complete" ? "✓" : item.status === "locked" ? "○" : "→"}</span><b>{item.reward}</b></div><h3>{item.title}</h3><p>{item.description}</p><div className="milestone-track"><i style={{ width: `${item.progress}%` }} /></div></article>)}</div></section>
      </section>
    </div>
  </main>;
}
