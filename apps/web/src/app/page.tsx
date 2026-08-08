"use client";

import { useState } from "react";
import { advanceDay, applyChoice, createBusiness } from "@enterpriseverse/simulation";
import type { BusinessStructure, SimulationState } from "@enterpriseverse/types";

const structures: Array<{ id: BusinessStructure; title: string; description: string }> = [
  { id: "sole_trader", title: "Sole Trader", description: "Maximum speed and control. You carry the responsibility." },
  { id: "partnership", title: "Partnership", description: "Share ownership and combine complementary strengths." },
  { id: "trio", title: "Trio", description: "Specialize roles while learning to coordinate." },
  { id: "team", title: "Team / Company", description: "Delegate and govern a larger organization." },
];

export default function Home() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [name, setName] = useState("Nova Goods");
  const [founder, setFounder] = useState("Founder");
  const [structure, setStructure] = useState<BusinessStructure>("sole_trader");

  if (!state) {
    return (
      <main className="landing">
        <div className="eyebrow">ENTERPRISEVERSE • PROTOTYPE</div>
        <h1>Run a business.<br /><span>Learn by doing.</span></h1>
        <p className="lead">Start with a real decision, not a lesson. Your market reacts to what you do.</p>
        <section className="setup-card">
          <label>Founder name<input value={founder} onChange={(e) => setFounder(e.target.value)} /></label>
          <label>Business name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <div><div className="label">Choose how you build</div><div className="structure-grid">
            {structures.map((item) => <button key={item.id} className={structure === item.id ? "structure selected" : "structure"} onClick={() => setStructure(item.id)}><strong>{item.title}</strong><small>{item.description}</small></button>)}
          </div></div>
          <button className="primary" onClick={() => setState(createBusiness({ name, structure, founderNames: [founder] }))}>Start Day 1 →</button>
        </section>
      </main>
    );
  }

  const { business, events, log } = state;
  const profit = business.revenue - business.expenses;
  const event = events[0];

  return (
    <main className="dashboard">
      <header><div><div className="eyebrow">ENTERPRISEVERSE</div><h1>{business.name}</h1></div><div className="day">DAY {business.day}</div></header>
      <section className="metrics">
        <Metric label="Cash" value={`₹${business.cash.toLocaleString()}`} />
        <Metric label="Revenue" value={`₹${business.revenue.toLocaleString()}`} />
        <Metric label="Profit" value={`₹${profit.toLocaleString()}`} />
        <Metric label="Reputation" value={`${business.reputation}/100`} />
      </section>
      <section className="grid">
        <div className="panel event-panel"><div className="eyebrow">TODAY'S DECISION</div><h2>{event?.title ?? "Your next move"}</h2><p>{event?.message ?? "Advance the business day and see what the market does."}</p>{event?.choices.map((item) => <button className="choice" key={item.id} onClick={() => setState(applyChoice(state, item))}><span>{item.label}</span><small>{Object.entries(item.effects).map(([k,v]) => `${k} ${v >= 0 ? "+" : ""}${v}`).join(" • ")}</small></button>)}<button className="primary" onClick={() => setState(advanceDay(state))}>Run the next day →</button></div>
        <div className="panel"><div className="eyebrow">BUSINESS LOG</div><div className="log">{log.slice(-8).reverse().map((line, i) => <div key={`${line}-${i}`}>{line}</div>)}</div></div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }
