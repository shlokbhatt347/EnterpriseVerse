"use client";

import { useMemo, useState } from "react";
import {
  buildPhase4DecisionBriefs,
  buildPhase4IntelligenceReport,
  buildPhase4StrategicPlan,
  buildPhase4Timeline,
  phase4MetricBand,
} from "@enterpriseverse/simulation";
import { useSimulation } from "../lib/simulation/useSimulation";
import type { Phase4Priority } from "@enterpriseverse/simulation";
import "./phase4.css";

const priorities: Phase4Priority[] = ["stability", "growth", "profitability", "market_share", "innovation", "customer_value"];
const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

export default function Phase4Page() {
  const { state, status, error, endDay } = useSimulation();
  const [priority, setPriority] = useState<Phase4Priority>("stability");
  const report = useMemo(() => state ? buildPhase4IntelligenceReport(state) : null, [state]);
  const plan = useMemo(() => state ? buildPhase4StrategicPlan(state, priority) : null, [state, priority]);
  const timeline = useMemo(() => state ? buildPhase4Timeline(state) : [], [state]);
  const decisionBriefs = useMemo(() => state ? buildPhase4DecisionBriefs(state, state.events.flatMap((event) => event.choices).slice(0, 8)) : [], [state]);

  if (!state || !report || !plan) return <main className="phase4-page"><section className="phase4-empty"><p>{status === "loading" ? "Loading your enterprise…" : "No active enterprise"}</p>{error && <p role="alert">{error}</p>}</section></main>;

  const cards = [
    ["Cash", money(report.finance.cash.value), phase4MetricBand(report.finance.cash.value > 0 ? 70 : 10)],
    ["Profit", money(report.finance.profit.value), phase4MetricBand(report.finance.profit.value >= 0 ? 70 : 20)],
    ["Market demand", `${Math.round(report.market.demand.value)}/100`, phase4MetricBand(report.market.demand.value)],
    ["Reputation", `${Math.round(state.business.reputation)}/100`, phase4MetricBand(state.business.reputation)],
    ["Workforce", `${Math.round(report.operations.workforceHealth.value)}/100`, phase4MetricBand(report.operations.workforceHealth.value)],
    ["Competition", `${Math.round(report.market.competitivePressure.value)}/100`, phase4MetricBand(100 - report.market.competitivePressure.value)],
  ] as const;

  return (
    <main className="phase4-page">
      <header className="phase4-header">
        <div><span className="phase4-kicker">PHASE 4 · COMMAND CENTRE</span><h1>{state.business.name}</h1><p>Day {state.business.day} · {report.market.trend} market · {report.market.confidence.value}/100 confidence</p></div>
        <button className="phase4-advance" onClick={() => void endDay()} disabled={status === "saving"}>{status === "saving" ? "Syncing…" : "Advance day"}</button>
      </header>

      <section className="phase4-grid phase4-metrics" aria-label="Executive metrics">
        {cards.map(([label, value, band]) => <article className={`phase4-card phase4-${band}`} key={label}><span>{label}</span><strong>{value}</strong></article>)}
      </section>

      <section className="phase4-grid phase4-main">
        <article className="phase4-panel phase4-brief">
          <div className="phase4-panel-head"><div><span className="phase4-kicker">EXECUTIVE BRIEFING</span><h2>{report.signals[0]?.title ?? "Business is operating normally"}</h2></div><span className="phase4-pill">{plan.priority.replace("_", " ")}</span></div>
          <p>Demand is <b>{report.market.trend}</b>, competitive pressure is <b>{Math.round(report.market.competitivePressure.value)}/100</b>, and customer satisfaction is <b>{Math.round(report.customers.satisfaction.value)}/100</b>.</p>
          <div className="phase4-signals">{report.signals.slice(0, 5).map((signal) => <div className="phase4-signal" key={signal.id}><b>{signal.title}</b><span>{signal.detail}</span><small>{signal.confidence} · {signal.source}</small></div>)}</div>
        </article>

        <article className="phase4-panel"><div className="phase4-panel-head"><div><span className="phase4-kicker">STRATEGIC PLAN</span><h2>Choose your priority</h2></div></div><div className="phase4-priority-grid">{priorities.map((item) => <button className={item === priority ? "selected" : ""} key={item} onClick={() => setPriority(item)}>{item.replace("_", " ")}</button>)}</div><p className="phase4-rationale">{plan.rationale}</p><ul>{plan.focus.map((focus) => <li key={focus}>{focus}</li>)}</ul></article>
      </section>

      <section className="phase4-grid phase4-main">
        <article className="phase4-panel"><div className="phase4-panel-head"><div><span className="phase4-kicker">DECISION CENTRE</span><h2>Available decisions</h2></div><span className="phase4-pill">uncertain outcomes</span></div>{decisionBriefs.length === 0 ? <p>No decision choices are currently pending.</p> : <div className="phase4-decisions">{decisionBriefs.map((brief) => <div className="phase4-decision" key={brief.choiceId}><div><b>{brief.label}</b><span>{brief.horizon.replace("_", " ")} · affects {brief.affectedSystems.join(", ")}</span></div><div className="phase4-deltas"><span>Cash {brief.preview.projected.cashDelta >= 0 ? "+" : ""}{Math.round(brief.preview.projected.cashDelta)}</span><span>Health {brief.preview.projected.healthDelta >= 0 ? "+" : ""}{Math.round(brief.preview.projected.healthDelta)}</span></div></div>)}</div>}</article>

        <article className="phase4-panel"><div className="phase4-panel-head"><div><span className="phase4-kicker">COMPETITIVE INTELLIGENCE</span><h2>Market threats</h2></div></div>{report.competitors.length === 0 ? <p>No competitor intelligence available.</p> : report.competitors.map((competitor) => <div className="phase4-competitor" key={competitor.name}><div><b>{competitor.name}</b><span>{competitor.strategy}</span></div><strong>{Math.round(competitor.share.value)}%</strong><em>{competitor.threat}</em></div>)}</article>
      </section>

      <section className="phase4-panel"><div className="phase4-panel-head"><div><span className="phase4-kicker">CONSEQUENCE TIMELINE</span><h2>What has been happening</h2></div></div><div className="phase4-timeline">{timeline.length === 0 ? <p>No history yet.</p> : timeline.slice(0, 12).map((item, index) => <div className="phase4-timeline-item" key={`${item.day}-${item.type}-${index}`}><span>Day {item.day}</span><div><b>{item.title}</b><p>{item.detail}</p></div><small>{item.confidence}</small></div>)}</div></section>
    </main>
  );
}
