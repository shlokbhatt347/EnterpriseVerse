"use client";

import { useState } from "react";
import { ExperienceShell } from "./experience-shell";
import "./cockpit.css";

const attention = [
  { tone: "danger", label: "CRITICAL", title: "Cash runway is tightening", body: "Supplier costs rose 18%. Review your next operating decision before committing more capital.", action: "Investigate" },
  { tone: "warn", label: "SIGNAL", title: "Orbit changed pricing", body: "A competitor moved down-market. Your premium position may be an opportunity—or a threat.", action: "Compare" },
  { tone: "good", label: "OPPORTUNITY", title: "Mumbai demand is accelerating", body: "Demand is up 8.2%. Check inventory and capacity before the next cycle.", action: "Explore" },
];

export default function Experience3Cockpit() {
  const [selected, setSelected] = useState(0);
  const [focus, setFocus] = useState("overview");

  return <ExperienceShell active="enterprise">
    <div className="cockpit-head"><div><div className="cockpit-eyebrow">ENTERPRISE · EXECUTIVE COCKPIT</div><h1>NOVA</h1><p>Day 42 · Technology · Premium differentiation</p></div><div className="cockpit-actions"><button className="quiet">Pause world</button><button className="primary">Continue →</button></div></div>

    <div className="cockpit-tabs" role="tablist" aria-label="Cockpit focus"><button className={focus === "overview" ? "active" : ""} onClick={() => setFocus("overview")}>Overview</button><button className={focus === "causes" ? "active" : ""} onClick={() => setFocus("causes")}>Causes</button><button className={focus === "future" ? "active" : ""} onClick={() => setFocus("future")}>What-if</button></div>

    {focus === "overview" && <>
      <section className="pulse-grid"><Metric label="CASH" value="₹4.82M" detail="28 days runway" tone="good" /><Metric label="REVENUE" value="₹8.24M" detail="+8.4% this cycle" tone="good" /><Metric label="PROFIT" value="₹1.21M" detail="14.7% margin" tone="neutral" /><Metric label="MARKET SHARE" value="31.4%" detail="+2.1% this cycle" tone="good" /><Metric label="PEOPLE" value="82 / 100" detail="Healthy organization" tone="neutral" /></section>
      <section className="attention-layout"><div className="panel attention-panel"><div className="panel-head"><div><span className="micro">ATTENTION ENGINE</span><h2>What needs you now?</h2></div><span className="count">3 signals</span></div><div className="attention-list">{attention.map((item, index) => <button key={item.title} className={`attention-item ${selected === index ? "selected" : ""}`} onClick={() => setSelected(index)}><span className={`signal ${item.tone}`} /><div><span className={`label ${item.tone}`}>{item.label}</span><strong>{item.title}</strong><p>{item.body}</p></div><span className="arrow">→</span></button>)}</div></div><div className="panel situation"><div className="panel-head"><div><span className="micro">CURRENT SITUATION</span><h2>{attention[selected].title}</h2></div></div><div className="cause-mini"><div><span>SUPPLIER COST</span><b>+18%</b></div><i>↓</i><div><span>PRODUCTION COST</span><b>+11%</b></div><i>↓</i><div><span>GROSS MARGIN</span><b>−4.2pp</b></div></div><div className="why"><span>WHY THIS MATTERS</span><p>Your margin is absorbing the shock faster than your revenue is growing.</p><button>Trace full cause →</button></div></div></section>
      <section className="decision-panel panel"><div className="panel-head"><div><span className="micro">DECISION THEATER</span><h2>Your next decision</h2><p>Compare the trade-offs before you commit.</p></div><span className="decision-step">01 / 03</span></div><div className="decision-grid"><Decision title="Negotiate" subtitle="Protect margin" risk="Medium" /><Decision title="Switch supplier" subtitle="Reduce dependency" risk="High" /><Decision title="Absorb cost" subtitle="Protect customer price" risk="Low" /></div><div className="decision-footer"><span>⌘ Enter to review · Esc to close</span><button className="primary">Review decision →</button></div></section>
    </>}

    {focus === "causes" && <CauseMap />}
    {focus === "future" && <WhatIf />}
  </ExperienceShell>;
}

function Metric({ label, value, detail, tone }: { label:string; value:string; detail:string; tone:string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small className={tone}>{detail}</small></div>; }
function Decision({ title, subtitle, risk }: { title:string; subtitle:string; risk:string }) { return <button className="decision"><span className="decision-index">01</span><strong>{title}</strong><span>{subtitle}</span><small>Risk · {risk}</small></button>; }
function CauseMap() { return <section className="panel big-panel"><span className="micro">CAUSALITY ENGINE</span><h2>Why is margin falling?</h2><p className="lead">Follow the chain from world event to enterprise consequence.</p><div className="cause-map"><Node title="GLOBAL SUPPLY PRESSURE" value="+24%" /><em>causes</em><Node title="SUPPLIER COST" value="+18%" /><em>drives</em><Node title="PRODUCTION COST" value="+11%" /><em>reduces</em><Node title="GROSS MARGIN" value="−4.2pp" /></div></section>; }
function Node({ title, value }: { title:string; value:string }) { return <div className="cause-node"><span>{title}</span><strong>{value}</strong></div>; }
function WhatIf() { return <section className="panel big-panel"><span className="micro">COUNTERFACTUAL LAB</span><h2>What if you negotiate?</h2><p className="lead">Explore a possible future without changing the live simulation.</p><div className="scenario-grid"><div><span>EXPECTED MARGIN</span><strong>18.9%</strong><small>↑ 4.2pp</small></div><div><span>EXPECTED CASH</span><strong>₹5.31M</strong><small>↑ ₹490K</small></div><div><span>CONFIDENCE</span><strong>81%</strong><small>Medium-high</small></div></div><div className="scenario-actions"><button className="quiet">Discard branch</button><button className="primary">Apply to decision →</button></div></section>; }
