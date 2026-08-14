"use client";

import { useEffect, useMemo, useState } from "react";
import { advanceDay, applyBusinessAction, calculateKpis } from "@enterpriseverse/simulation";
import type { BusinessAction } from "@enterpriseverse/simulation";
import type { SimulationState } from "@enterpriseverse/types";
import { ExperienceShell } from "./experience-shell";
import type { InspectorPayload } from "./experience-shell";
import "./cockpit.css";

const SAVE_KEY = "enterpriseverse:active-business:v1";
type Focus = "overview" | "causes" | "future";
type Attention = { tone: "danger" | "warn" | "good"; label: string; title: string; body: string; priority: number; kind: string };
type Scenario = "raise-price" | "quality" | "marketing";
const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
const inspect = (payload: InspectorPayload) => window.dispatchEvent(new CustomEvent<InspectorPayload>("ev3:inspect", { detail: payload }));

export default function Experience3Cockpit() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [focus, setFocus] = useState<Focus>("overview");
  const [selected, setSelected] = useState(0);
  const [price, setPrice] = useState("120");
  const [message, setMessage] = useState("");

  useEffect(() => { try { const raw = window.localStorage.getItem(SAVE_KEY); if (raw) setState(JSON.parse(raw) as SimulationState); } catch { setState(null); } }, []);
  useEffect(() => { if (state) window.localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }, [state]);

  const kpis = state ? calculateKpis(state) : null;
  const attention = useMemo<Attention[]>(() => {
    if (!state || !kpis) return [];
    const items: Attention[] = [];
    const latest = state.events?.[0];
    if (latest) items.push({ tone: "warn", label: "EVENT", title: latest.title, body: latest.message, priority: 70, kind: "WORLD EVENT" });
    if (kpis.cashRunwayDays < 14) items.push({ tone: "danger", label: "CRITICAL", title: "Cash runway is tightening", body: `Only ${kpis.cashRunwayDays} days of runway remain. Review spending before taking another large risk.`, priority: 100, kind: "FINANCE RISK" });
    if (state.business.marketShare < 10) items.push({ tone: "warn", label: "SIGNAL", title: "Market position needs attention", body: `Market share is ${state.business.marketShare.toFixed(1)}%. Investigate demand, pricing and competitors.`, priority: 82, kind: "MARKET SIGNAL" });
    if (state.market?.trend === "growing") items.push({ tone: "good", label: "OPPORTUNITY", title: "Demand is accelerating", body: "The market is growing. Check inventory and capacity before the next cycle.", priority: 55, kind: "OPPORTUNITY" });
    if (!items.length) items.push({ tone: "good", label: "STABLE", title: "No critical issue right now", body: "Your enterprise has no high-priority signal. Use this cycle to strengthen your position.", priority: 20, kind: "SYSTEM" });
    return items.sort((a, b) => b.priority - a.priority).slice(0, 4);
  }, [state, kpis]);

  const runAction = (action: BusinessAction) => { if (!state) return; try { setState(applyBusinessAction(state, action)); setMessage("Decision applied · simulation state updated"); window.setTimeout(() => setMessage(""), 1800); } catch (error) { setMessage(error instanceof Error ? error.message : "Decision could not be completed"); } };
  const nextDay = () => { if (!state) return; setState(advanceDay(state)); setMessage("Day advanced · world state recalculated"); window.setTimeout(() => setMessage(""), 1800); };
  const inspectAttention = (item: Attention) => inspect({ kind: item.kind, title: item.title, summary: item.body, why: item.priority >= 80 ? "High-priority signals can materially change the next decision. Resolve or investigate them before lower-value work." : "This signal is worth understanding, but it does not currently outrank higher-priority decisions.", connections: ["Company state", "Market", "Recent events"], actions: [{ label: "Open Intelligence", href: "/intelligence" }, { label: "Keep in focus" }] });
  const inspectMetric = (kind: string, title: string, value: string, summary: string, why: string, connections: string[]) => inspect({ kind, title, value, summary, why, connections, actions: [{ label: "Open full analysis", href: "/analytics" }] });

  if (!state || !kpis) return <ExperienceShell active="enterprise"><section className="big-panel panel empty-state"><span className="micro">ENTERPRISE COCKPIT</span><h1>No active enterprise</h1><p className="lead">Start a business in the main simulator first. Experience 3.0 will automatically pick up the saved simulation.</p><a className="primary" href="/">Open simulator →</a></section></ExperienceShell>;

  const current = attention[selected] ?? attention[0];

  return <ExperienceShell active="enterprise">
    <div className="cockpit-head"><div><div className="cockpit-eyebrow">ENTERPRISE · EXECUTIVE COCKPIT</div><h1>{state.business.name}</h1><p>Day {state.business.day} · {state.business.industry} · {state.business.idea}</p></div><div className="cockpit-actions"><span className="live-chip">● SIMULATION LIVE</span><button className="primary" onClick={nextDay}>End Day →</button></div></div>
    <div className="cockpit-tabs" role="tablist" aria-label="Cockpit focus">{(["overview", "causes", "future"] as Focus[]).map((item) => <button key={item} className={focus === item ? "active" : ""} onClick={() => setFocus(item)}>{item === "overview" ? "Overview" : item === "causes" ? "Causes" : "What-if"}</button>)}</div>
    {message && <div className="cockpit-toast" role="status" aria-live="polite">{message}</div>}
    {focus === "overview" && <>
      <section className="pulse-grid">
        <Metric label="CASH" value={money(state.business.cash)} detail={`${kpis.cashRunwayDays} days runway`} tone={kpis.cashRunwayDays < 14 ? "danger" : "good"} onClick={() => inspectMetric("FINANCE", "Cash runway", money(state.business.cash), `${kpis.cashRunwayDays} days of operating runway remain.`, "Cash determines how much strategic risk the enterprise can absorb before liquidity becomes a constraint.", ["Operating costs", "Profit", "Runway", "Investments"])} />
        <Metric label="REVENUE" value={money(state.business.revenue)} detail={`${state.business.customers.length} customers`} tone="good" onClick={() => inspectMetric("PERFORMANCE", "Revenue", money(state.business.revenue), `Revenue is generated across ${state.business.customers.length} customers.`, "Revenue is the top-line result of demand, pricing and customer activity.", ["Customers", "Price", "Demand", "Profit"])} />
        <Metric label="PROFIT" value={money(kpis.profit)} detail={`${kpis.grossMargin}% margin`} tone={kpis.profit >= 0 ? "good" : "danger"} onClick={() => inspectMetric("FINANCE", "Profit", money(kpis.profit), `Current gross margin is ${kpis.grossMargin}%.`, "Profit connects revenue to the cost structure and determines how much cash the enterprise can generate.", ["Revenue", "Expenses", "Margin", "Cash"])} />
        <Metric label="MARKET SHARE" value={`${state.business.marketShare.toFixed(1)}%`} detail={`Demand ${state.market?.demandIndex ?? 100}`} tone="good" onClick={() => inspectMetric("MARKET", "Market share", `${state.business.marketShare.toFixed(1)}%`, `Demand index is ${state.market?.demandIndex ?? 100}.`, "Market share shows your competitive position inside the current demand environment.", ["Demand", "Competitors", "Price", "Reputation"])} />
        <Metric label="PEOPLE" value={`${state.business.reputation}/100`} detail="Company reputation" tone="neutral" onClick={() => inspectMetric("PEOPLE", "Company reputation", `${state.business.reputation}/100`, "Reputation is a live signal of how the enterprise is perceived.", "Reputation can influence customers, hiring and long-term resilience.", ["Customers", "People", "Brand", "Market"])}/>
      </section>
      <section className="attention-layout"><div className="panel attention-panel"><div className="panel-head"><div><span className="micro">ATTENTION ENGINE</span><h2>What needs you now?</h2></div><span className="count">{attention.length} ranked signals</span></div><div className="attention-list">{attention.map((item, index) => <button key={`${item.title}-${index}`} className={`attention-item ${selected === index ? "selected" : ""}`} onClick={() => { setSelected(index); inspectAttention(item); }}><span className={`signal ${item.tone}`} /><div><span className={`label ${item.tone}`}>{item.label} · {item.priority}</span><strong>{item.title}</strong><p>{item.body}</p></div><span className="arrow">→</span></button>)}</div></div>
        <div className="panel situation"><div className="panel-head"><div><span className="micro">CURRENT SITUATION</span><h2>{current.title}</h2></div></div><div className="cause-mini"><div><span>REVENUE</span><b>{money(state.business.revenue)}</b></div><i>↓</i><div><span>EXPENSES</span><b>{money(state.business.expenses)}</b></div><i>↓</i><div><span>PROFIT</span><b>{money(kpis.profit)}</b></div></div><div className="why"><span>WHY THIS MATTERS</span><p>{current.body}</p><button onClick={() => { inspectAttention(current); setFocus("causes"); }}>Trace full cause →</button></div></div>
      </section>
      <DecisionTheater state={state} kpis={kpis} price={price} setPrice={setPrice} runAction={runAction} inspect={inspect} />
    </>}
    {focus === "causes" && <CauseMap state={state} kpis={kpis} attention={attention} />}
    {focus === "future" && <WhatIf state={state} kpis={kpis} runAction={runAction} />}
  </ExperienceShell>;
}

function Metric({ label, value, detail, tone, onClick }: { label: string; value: string; detail: string; tone: string; onClick: () => void }) { return <button className="metric metric-button" onClick={onClick}><span>{label}</span><strong>{value}</strong><small className={tone}>{detail}</small><em>Inspect →</em></button>; }

function DecisionTheater({ state, kpis, price, setPrice, runAction, inspect }: { state: SimulationState; kpis: ReturnType<typeof calculateKpis>; price: string; setPrice: (value: string) => void; runAction: (action: BusinessAction) => void; inspect: (payload: InspectorPayload) => void }) {
  const actions = [
    { id: "price", title: "Change price", subtitle: `Current ${money(kpis.price)}`, risk: "Medium", tradeoff: "Margin ↔ demand", action: () => runAction({ type: "set_price", price: Number(price) }) },
    { id: "quality", title: "Invest in quality", subtitle: "Improve product value", risk: "Medium", tradeoff: "Cost → reputation", action: () => runAction({ type: "improve_quality", investment: 1000 }) },
    { id: "marketing", title: "Launch marketing", subtitle: "Create demand", risk: "Low", tradeoff: "Cash → awareness", action: () => runAction({ type: "marketing", budget: 1000 }) },
  ];
  return <section className="decision-panel panel"><div className="panel-head"><div><span className="micro">DECISION THEATER</span><h2>Make the call</h2><p>Every action shows its trade-off before it changes the live simulation.</p></div><span className="decision-step">LIVE STATE</span></div><div className="decision-grid">{actions.map((item, index) => <div className="decision" key={item.id}><span className="decision-index">0{index + 1}</span><strong>{item.title}</strong><span>{item.subtitle}</span><small>Risk · {item.risk}</small><em>{item.tradeoff}</em><div className="action-control">{item.id === "price" && <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="20" max="2000" aria-label="New price" />}<button className="secondary" onClick={() => inspect({ kind: "DECISION", title: item.title, summary: item.subtitle, why: `Primary trade-off: ${item.tradeoff}. Review the consequences before committing.`, connections: ["Cash", "Revenue", "Market share", "Reputation"], actions: [{ label: "Commit decision", ...(item.id === "price" ? {} : {}) }] })}>Review →</button><button className="primary decision-commit" onClick={item.action}>Make call</button></div></div>)}</div></section>;
}

function CauseMap({ state, kpis, attention }: { state: SimulationState; kpis: ReturnType<typeof calculateKpis>; attention: Attention[] }) {
  const costPressure = state.business.expenses > state.business.revenue * 0.75;
  const demandPressure = state.business.marketShare < 10;
  const runwayPressure = kpis.cashRunwayDays < 14;
  return <section className="panel big-panel"><span className="micro">CAUSALITY ENGINE · LIVE STATE</span><h2>Trace the enterprise, not just the number.</h2><p className="lead">The current position is an interconnected system. Start with the outcome, then follow the drivers.</p><div className="causal-flow"><Node title="WORLD" value={state.market?.trend === "growing" ? "Demand growing" : "Market shifting"} tone="neutral" /><Connector label="changes" /><Node title="MARKET" value={`${state.business.marketShare.toFixed(1)}% share`} tone={demandPressure ? "warn" : "good"} /><Connector label="creates" /><Node title="REVENUE" value={money(state.business.revenue)} tone="good" /><Connector label="minus" /><Node title="COST BASE" value={money(state.business.expenses)} tone={costPressure ? "warn" : "neutral"} /><Connector label="produces" /><Node title="PROFIT" value={money(kpis.profit)} tone={kpis.profit >= 0 ? "good" : "danger"} /></div><div className="causal-drivers"><div className="driver"><span className={runwayPressure ? "danger-dot" : "good-dot"} /><div><strong>Liquidity</strong><p>{kpis.cashRunwayDays} days runway. {runwayPressure ? "Liquidity is a constraint on risk-taking." : "Liquidity currently gives the enterprise room to act."}</p></div></div><div className="driver"><span className={demandPressure ? "warn-dot" : "good-dot"} /><div><strong>Competitive position</strong><p>{demandPressure ? "Low market share makes demand and positioning a priority." : "Current share is not a critical constraint."}</p></div></div><div className="driver"><span className={costPressure ? "warn-dot" : "good-dot"} /><div><strong>Cost structure</strong><p>{costPressure ? "Expenses consume a large portion of revenue." : "The current cost base is not dominating revenue."}</p></div></div></div><div className="causal-evidence"><span className="micro">EVIDENCE TO INVESTIGATE</span>{attention.map((item) => <div key={item.title}><b>{item.label}</b><span>{item.title}</span><em>{item.priority}</em></div>)}</div></section>;
}

function Connector({ label }: { label: string }) { return <div className="causal-connector"><span>{label}</span><i>→</i></div>; }
function Node({ title, value, tone }: { title: string; value: string; tone: string }) { return <div className={`cause-node ${tone}`}><span>{title}</span><strong>{value}</strong></div>; }

function WhatIf({ state, kpis, runAction }: { state: SimulationState; kpis: ReturnType<typeof calculateKpis>; runAction: (action: BusinessAction) => void }) {
  const [scenario, setScenario] = useState<Scenario>("raise-price");
  const [amount, setAmount] = useState(8);
  const [committed, setCommitted] = useState(false);
  const currentPrice = kpis.price || 1;
  const priceDelta = scenario === "raise-price" ? amount / 100 : 0;
  const scenarioPrice = scenario === "raise-price" ? currentPrice * (1 + priceDelta) : currentPrice;
  const demandDelta = scenario === "raise-price" ? -amount * 0.55 : scenario === "marketing" ? 5 : 2;
  const marginDelta = scenario === "raise-price" ? amount * 0.18 : scenario === "quality" ? 1.5 : -1;
  const scenarioMargin = Math.max(0, Math.min(99, kpis.grossMargin + marginDelta));
  const scenarioCash = state.business.cash + Math.round(kpis.profit * (scenario === "quality" ? -0.12 : scenario === "marketing" ? -0.08 : 0.08));
  const confidence = scenario === "raise-price" ? "Medium" : "Exploratory";

  const commit = () => {
    if (scenario === "raise-price") runAction({ type: "set_price", price: Math.round(scenarioPrice) });
    if (scenario === "quality") runAction({ type: "improve_quality", investment: 1000 });
    if (scenario === "marketing") runAction({ type: "marketing", budget: 1000 });
    setCommitted(true);
    window.setTimeout(() => setCommitted(false), 2200);
  };

  return <section className="panel big-panel"><span className="micro">COUNTERFACTUAL LAB</span><h2>Explore a possible future before committing.</h2><p className="lead">This branch is non-destructive. Change the scenario, inspect the trade-offs, then decide whether to apply the real action.</p><div className="scenario-selector">{(["raise-price", "quality", "marketing"] as Scenario[]).map((item) => <button key={item} className={scenario === item ? "active" : ""} onClick={() => setScenario(item)}>{item === "raise-price" ? "Raise price" : item === "quality" ? "Invest in quality" : "Launch marketing"}</button>)}</div>{scenario === "raise-price" && <label className="scenario-input">Price increase <input type="range" min="1" max="25" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /><strong>+{amount}%</strong></label>}<div className="scenario-grid"><div><span>CURRENT PRICE</span><strong>{money(currentPrice)}</strong><small>Live state</small></div><div><span>SCENARIO PRICE</span><strong>{money(scenarioPrice)}</strong><small>{scenario === "raise-price" ? `+${amount}%` : "No price change"}</small></div><div><span>DEMAND SIGNAL</span><strong>{demandDelta > 0 ? "+" : ""}{demandDelta.toFixed(1)}%</strong><small>Directional estimate</small></div><div><span>MARGIN</span><strong>{scenarioMargin.toFixed(1)}%</strong><small>Current {kpis.grossMargin}%</small></div><div><span>CASH EFFECT</span><strong>{money(scenarioCash)}</strong><small>Illustrative branch</small></div><div><span>CONFIDENCE</span><strong>{confidence}</strong><small>Not a guarantee</small></div></div><div className="scenario-tradeoffs"><div><span>UPSIDE</span><p>{scenario === "raise-price" ? "Higher unit economics if demand holds." : scenario === "quality" ? "Stronger product value and reputation." : "More demand and awareness."}</p></div><div><span>RISK</span><p>{scenario === "raise-price" ? "Demand may soften if customers are price-sensitive." : scenario === "quality" ? "Cash is spent before benefits arrive." : "Marketing can consume cash without immediate conversion."}</p></div><div><span>STAKEHOLDERS</span><p>Customers, employees, competitors and cash position can react differently.</p></div></div><div className="scenario-actions"><span className="confidence">Scenario only · live state unchanged</span><button className="primary" onClick={commit}>{committed ? "Decision committed ✓" : "Commit this decision →"}</button></div></section>;
}
