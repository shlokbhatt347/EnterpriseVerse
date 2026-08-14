"use client";

import { useEffect, useMemo, useState } from "react";
import { advanceDay, applyBusinessAction, calculateKpis } from "@enterpriseverse/simulation";
import type { BusinessAction } from "@enterpriseverse/simulation";
import type { SimulationState } from "@enterpriseverse/types";
import { ExperienceShell } from "./experience-shell";
import "./cockpit.css";

const SAVE_KEY = "enterpriseverse:active-business:v1";

type Focus = "overview" | "causes" | "future";
type Attention = { tone: "danger" | "warn" | "good"; label: string; title: string; body: string };

const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

export default function Experience3Cockpit() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [focus, setFocus] = useState<Focus>("overview");
  const [selected, setSelected] = useState(0);
  const [price, setPrice] = useState("120");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (raw) setState(JSON.parse(raw) as SimulationState);
    } catch {
      setState(null);
    }
  }, []);

  useEffect(() => {
    if (!state) return;
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }, [state]);

  const kpis = state ? calculateKpis(state) : null;
  const attention = useMemo<Attention[]>(() => {
    if (!state || !kpis) return [];
    const items: Attention[] = [];
    const latest = state.events?.[0];
    if (latest) items.push({ tone: "warn", label: "EVENT", title: latest.title, body: latest.message });
    if (kpis.cashRunwayDays < 14) items.push({ tone: "danger", label: "CRITICAL", title: "Cash runway is tightening", body: `Only ${kpis.cashRunwayDays} days of runway remain. Review spending before taking another large risk.` });
    if (state.business.marketShare < 10) items.push({ tone: "warn", label: "SIGNAL", title: "Market position needs attention", body: `Market share is ${state.business.marketShare.toFixed(1)}%. Investigate demand, pricing and competitors.` });
    if (state.market?.trend === "growing") items.push({ tone: "good", label: "OPPORTUNITY", title: "Demand is accelerating", body: "The market is growing. Check inventory and capacity before the next cycle." });
    if (!items.length) items.push({ tone: "good", label: "STABLE", title: "No critical issue right now", body: "Your enterprise has no high-priority signal. Use this cycle to strengthen your position." });
    return items.slice(0, 3);
  }, [state, kpis]);

  const runAction = (action: BusinessAction) => {
    if (!state) return;
    try {
      setState(applyBusinessAction(state, action));
      setMessage("Decision applied · simulation state updated");
      window.setTimeout(() => setMessage(""), 1800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Decision could not be completed");
    }
  };

  const nextDay = () => {
    if (!state) return;
    setState(advanceDay(state));
    setMessage("Day advanced · world state recalculated");
    window.setTimeout(() => setMessage(""), 1800);
  };

  if (!state || !kpis) {
    return <ExperienceShell active="enterprise"><section className="big-panel panel empty-state"><span className="micro">ENTERPRISE COCKPIT</span><h1>No active enterprise</h1><p className="lead">Start a business in the main simulator first. Experience 3.0 will automatically pick up the saved simulation.</p><a className="primary" href="/">Open simulator →</a></section></ExperienceShell>;
  }

  const current = attention[selected] ?? attention[0];
  const margin = kpis.grossMargin;
  const whatIfMargin = Math.min(99, margin + 3.2);
  const whatIfCash = state.business.cash + Math.round(Math.max(0, kpis.profit) * 0.35);

  return <ExperienceShell active="enterprise">
    <div className="cockpit-head">
      <div><div className="cockpit-eyebrow">ENTERPRISE · EXECUTIVE COCKPIT</div><h1>{state.business.name}</h1><p>Day {state.business.day} · {state.business.industry} · {state.business.idea}</p></div>
      <div className="cockpit-actions"><span className="live-chip">● SIMULATION LIVE</span><button className="primary" onClick={nextDay}>End Day →</button></div>
    </div>

    <div className="cockpit-tabs" role="tablist" aria-label="Cockpit focus">
      {(["overview", "causes", "future"] as Focus[]).map((item) => <button key={item} className={focus === item ? "active" : ""} onClick={() => setFocus(item)}>{item === "overview" ? "Overview" : item === "causes" ? "Causes" : "What-if"}</button>)}
    </div>

    {message && <div className="cockpit-toast" role="status" aria-live="polite">{message}</div>}

    {focus === "overview" && <>
      <section className="pulse-grid">
        <Metric label="CASH" value={money(state.business.cash)} detail={`${kpis.cashRunwayDays} days runway`} tone={kpis.cashRunwayDays < 14 ? "danger" : "good"} />
        <Metric label="REVENUE" value={money(state.business.revenue)} detail={`${state.business.customers.length} customers`} tone="good" />
        <Metric label="PROFIT" value={money(kpis.profit)} detail={`${kpis.grossMargin}% margin`} tone={kpis.profit >= 0 ? "good" : "danger"} />
        <Metric label="MARKET SHARE" value={`${state.business.marketShare.toFixed(1)}%`} detail={`Demand ${state.market?.demandIndex ?? 100}`} tone="good" />
        <Metric label="PEOPLE" value={`${state.business.reputation}/100`} detail="Company reputation" tone="neutral" />
      </section>

      <section className="attention-layout">
        <div className="panel attention-panel"><div className="panel-head"><div><span className="micro">ATTENTION ENGINE</span><h2>What needs you now?</h2></div><span className="count">{attention.length} signals</span></div><div className="attention-list">{attention.map((item, index) => <button key={`${item.title}-${index}`} className={`attention-item ${selected === index ? "selected" : ""}`} onClick={() => setSelected(index)}><span className={`signal ${item.tone}`} /><div><span className={`label ${item.tone}`}>{item.label}</span><strong>{item.title}</strong><p>{item.body}</p></div><span className="arrow">→</span></button>)}</div></div>
        <div className="panel situation"><div className="panel-head"><div><span className="micro">CURRENT SITUATION</span><h2>{current.title}</h2></div></div><div className="cause-mini"><div><span>REVENUE</span><b>{money(state.business.revenue)}</b></div><i>↓</i><div><span>EXPENSES</span><b>{money(state.business.expenses)}</b></div><i>↓</i><div><span>PROFIT</span><b>{money(kpis.profit)}</b></div></div><div className="why"><span>WHY THIS MATTERS</span><p>{current.body}</p><button onClick={() => setFocus("causes")}>Trace full cause →</button></div></div>
      </section>

      <section className="decision-panel panel"><div className="panel-head"><div><span className="micro">DECISION THEATER</span><h2>Act on the enterprise</h2><p>Actions here update the real saved simulation state.</p></div><span className="decision-step">LIVE STATE</span></div><div className="decision-grid"><Action title="Set price" subtitle={`Current ${money(kpis.price)}`} risk="Medium" onClick={() => runAction({ type: "set_price", price: Number(price) })} control={<input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="20" max="2000" aria-label="New price" />} /><Action title="Invest in quality" subtitle="Improve product value" risk="Medium" onClick={() => runAction({ type: "improve_quality", investment: 1000 })} /><Action title="Launch marketing" subtitle="Create demand" risk="Low" onClick={() => runAction({ type: "marketing", budget: 1000 })} /></div></section>
    </>}

    {focus === "causes" && <CauseMap state={state} kpis={kpis} />}
    {focus === "future" && <WhatIf margin={margin} whatIfMargin={whatIfMargin} cash={state.business.cash} whatIfCash={whatIfCash} />}
  </ExperienceShell>;
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small className={tone}>{detail}</small></div>; }

function Action({ title, subtitle, risk, onClick, control }: { title: string; subtitle: string; risk: string; onClick: () => void; control?: React.ReactNode }) { return <div className="decision"><span className="decision-index">01</span><strong>{title}</strong><span>{subtitle}</span><small>Risk · {risk}</small><div className="action-control">{control}<button className="secondary" onClick={onClick}>Review →</button></div></div>; }

function CauseMap({ state, kpis }: { state: SimulationState; kpis: ReturnType<typeof calculateKpis> }) { return <section className="panel big-panel"><span className="micro">CAUSALITY ENGINE · LIVE STATE</span><h2>Why is the enterprise performing this way?</h2><p className="lead">Trace the current business position from financial state to operating drivers.</p><div className="cause-map"><Node title="REVENUE" value={`₹${Math.round(state.business.revenue).toLocaleString("en-IN")}`} /><em>minus</em><Node title="EXPENSES" value={`₹${Math.round(state.business.expenses).toLocaleString("en-IN")}`} /><em>creates</em><Node title="PROFIT" value={`₹${Math.round(kpis.profit).toLocaleString("en-IN")}`} /><em>defines</em><Node title="MARGIN" value={`${kpis.grossMargin}%`} /></div><div className="cause-explain"><strong>Primary operating signals</strong><span>Cash runway: {kpis.cashRunwayDays} days</span><span>Customers: {state.business.customers.length}</span><span>Market share: {state.business.marketShare.toFixed(1)}%</span><span>Reputation: {state.business.reputation}/100</span></div></section>; }

function Node({ title, value }: { title: string; value: string }) { return <div className="cause-node"><span>{title}</span><strong>{value}</strong></div>; }

function WhatIf({ margin, whatIfMargin, cash, whatIfCash }: { margin: number; whatIfMargin: number; cash: number; whatIfCash: number }) { return <section className="panel big-panel"><span className="micro">COUNTERFACTUAL LAB</span><h2>Explore a possible future</h2><p className="lead">This preview is intentionally non-destructive. Your live simulation remains unchanged until you commit a real decision.</p><div className="scenario-grid"><div><span>CURRENT MARGIN</span><strong>{margin}%</strong><small>Live state</small></div><div><span>SCENARIO MARGIN</span><strong>{whatIfMargin.toFixed(1)}%</strong><small>Illustrative upside</small></div><div><span>SCENARIO CASH</span><strong>{money(whatIfCash)}</strong><small>Illustrative outcome</small></div></div><div className="scenario-actions"><span className="confidence">Scenario confidence · exploratory</span><button className="primary" onClick={() => undefined}>Open Scenario Lab →</button></div><p className="muted-note">Current cash: {money(cash)}. This first Experience 3.0 layer previews the interaction model; the next iteration will connect scenario branches to the simulation's full counterfactual engine.</p></section>; }
