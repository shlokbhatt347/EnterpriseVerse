"use client";

import { useEffect, useMemo, useState } from "react";
import { advanceDay, applyChoice, buildDecisionDebrief, getCoachInsight, getFounderProgress } from "@enterpriseverse/simulation";
import type { SimulationChoice, SimulationState } from "@enterpriseverse/types";
import "./play.css";

const SAVE_KEY = "enterpriseverse:active-business:v1";
const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
const skillLabels = { strategy: "Strategy", finance: "Finance", marketing: "Marketing", operations: "Operations", leadership: "Leadership", risk: "Risk" } as const;

export default function PlayPage() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
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

  if (!state || !progress || !coach) return <main className="play-shell"><section className="empty-play"><span className="play-kicker">ENTERPRISEVERSE · FOUNDER MODE</span><h1>Start your first enterprise.</h1><p>Create a business on the main simulator first. Your saved company will automatically appear here.</p><a className="play-primary" href="/EnterpriseVerse/">Open simulator →</a></section></main>;

  const commit = (choice: SimulationChoice) => { setSelected(choice.id); setMessage("Decision recorded. Your next move is yours to make."); setState((current) => current ? applyChoice(current, choice) : current); };
  const endDay = () => { setSelected(null); setMessage("Day advanced. The market, customers and competitors have reacted."); setState((current) => current ? advanceDay(current) : current); };

  return <main className="play-shell">
    <header className="play-topbar"><a href="/EnterpriseVerse/" className="play-brand">ENTERPRISEVERSE</a><div className="play-day">DAY {state.business.day}<span>·</span>{state.business.name}</div><div className="play-cash">{money(state.business.cash)}</div></header>
    <div className="play-grid">
      <aside className="play-sidebar">
        <div className="play-profile"><div className="avatar">{state.business.founders[0]?.name.slice(0, 1).toUpperCase() ?? "F"}</div><div><strong>{state.business.founders[0]?.name ?? "Founder"}</strong><span>Founder · Level {progress.level}</span></div></div>
        <div className="play-section-label">FOUNDER SKILLS</div>
        {(Object.entries(progress.skills) as [keyof typeof skillLabels, number][]).map(([key, value]) => <div className="skill-row" key={key}><div><span>{skillLabels[key]}</span><b>{value}</b></div><div className="skill-track"><i style={{ width: `${value}%` }} /></div></div>)}
        <div className="play-section-label">PROGRESS</div><div className="xp-row"><span>{progress.xp} XP</span><span>{progress.xpToNextLevel} XP</span></div><div className="xp-track"><i style={{ width: `${Math.min(100, (progress.xp / progress.xpToNextLevel) * 100)}%` }} /></div>
      </aside>
      <section className="play-main">
        <div className="play-hero"><div><span className="play-kicker">{state.business.industry} · LIVE SIMULATION</span><h1>{state.business.name}</h1><p>{state.business.idea}</p></div><div className={`health ${progress.health}`}>{progress.health.toUpperCase()}</div></div>
        <div className="metric-grid"><div><span>CASH</span><strong>{money(state.business.cash)}</strong></div><div><span>REVENUE</span><strong>{money(state.business.revenue)}</strong></div><div><span>MARKET SHARE</span><strong>{state.business.marketShare.toFixed(1)}%</strong></div><div><span>REPUTATION</span><strong>{Math.round(state.business.reputation)}/100</strong></div></div>
        <section className={`coach coach-${coach.priority}`}><div className="coach-icon">✦</div><div><span>FOUNDER COACH · {skillLabels[coach.skill].toUpperCase()}</span><h2>{coach.headline}</h2><p>{coach.explanation}</p><strong>Try this: {coach.action}</strong></div></section>
        {event ? <section className="decision-card"><div className="decision-head"><div><span className="play-kicker">DAY {event.day} · DECISION</span><h2>{event.title}</h2><p>{event.message}</p></div><span className="decision-count">{event.choices.length} OPTIONS</span></div><div className="choice-grid">{event.choices.map((choice) => <button key={choice.id} type="button" className={selected === choice.id ? "choice selected" : "choice"} onClick={() => commit(choice)}><span className="choice-title">{choice.label}</span><span className="choice-effects">{Object.entries(choice.effects).slice(0, 3).map(([key, value]) => <em key={key} className={value >= 0 ? "up" : "down"}>{key} {value >= 0 ? "+" : ""}{value}</em>)}</span></button>)}</div>{debrief ? <div className="debrief"><div><span>DECISION QUALITY</span><strong>{debrief.score}/100</strong></div><div><span>CONSEQUENCE</span><p>{debrief.consequence}</p></div><div><span>LESSON</span><p>{debrief.lesson}</p></div></div> : null}</section> : <section className="complete-card"><span className="play-kicker">DAY COMPLETE</span><h2>You've made today's calls.</h2><p>Advance the simulation to let customers, competitors, the market and your operations respond.</p></section>}
        <div className="play-actions"><span role="status" aria-live="polite">{message}</span><button type="button" className="play-primary" onClick={endDay} disabled={Boolean(event && !selected)}>End Day & See What Happens →</button></div>
        <section className="milestones"><div className="section-title"><span>FOUNDER JOURNEY</span><strong>Your next milestones</strong></div><div className="milestone-grid">{progress.milestones.map((item) => <article key={item.id} className={`milestone ${item.status}`}><div className="milestone-top"><span>{item.status === "complete" ? "✓" : item.status === "locked" ? "○" : "→"}</span><b>{item.reward}</b></div><h3>{item.title}</h3><p>{item.description}</p><div className="milestone-track"><i style={{ width: `${item.progress}%` }} /></div></article>)}</div></section>
      </section>
    </div>
  </main>;
}
