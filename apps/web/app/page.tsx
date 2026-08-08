"use client";

import { useMemo, useState } from "react";
import { advanceDay, applyChoice, createBusiness } from "@enterpriseverse/simulation";
import type { BusinessStructure, SimulationChoice, SimulationState } from "@enterpriseverse/types";

const structures: { id: BusinessStructure; name: string; capital: string; description: string }[] = [
  { id: "sole_trader", name: "Sole Trader", capital: "₹20,000", description: "Maximum control. You own the upside and carry the risk." },
  { id: "partnership", name: "Partnership", capital: "₹35,000", description: "Share ownership, capital and decisions with one partner." },
  { id: "trio", name: "Trio", capital: "₹50,000", description: "Three founders. More capability, but more coordination." },
  { id: "team", name: "Company", capital: "₹75,000", description: "A larger founding team with roles, shared control and higher costs." },
];

const industries = ["Food & Beverage", "Retail", "Technology", "Services", "Manufacturing", "Creative", "Other"];

export default function Home() {
  const [started, setStarted] = useState(false);
  const [founder, setFounder] = useState("Shlok");
  const [businessName, setBusinessName] = useState("");
  const [idea, setIdea] = useState("");
  const [industry, setIndustry] = useState(industries[0]);
  const [structure, setStructure] = useState<BusinessStructure>("sole_trader");
  const [partners, setPartners] = useState("");
  const [state, setState] = useState<SimulationState | null>(null);

  const founderNames = useMemo(() => [founder, ...partners.split(",").map((name) => name.trim()).filter(Boolean)], [founder, partners]);
  const selected = structures.find((item) => item.id === structure)!;

  const launch = () => {
    if (!founder.trim() || !businessName.trim() || !idea.trim()) return;
    const maxFounders = structure === "sole_trader" ? 1 : structure === "partnership" ? 2 : structure === "trio" ? 3 : 6;
    setState(createBusiness({ name: businessName.trim(), idea: idea.trim(), industry, structure, founderNames: founderNames.slice(0, maxFounders) }));
    setStarted(true);
  };

  if (!started || !state) {
    return (
      <main className="shell">
        <div className="content onboarding">
          <div className="eyebrow">EnterpriseVerse · Founder Mode</div>
          <h1>Build a business.<br />Learn by running it.</h1>
          <p className="muted">There are no lessons waiting for you. You will face customers, suppliers, competitors and money problems—and your decisions will create the learning.</p>

          <section className="step card">
            <div className="eyebrow">01 · Founder</div>
            <div className="field"><label>Your name</label><input value={founder} onChange={(event) => setFounder(event.target.value)} placeholder="Founder name" /></div>
          </section>

          <section className="step card">
            <div className="eyebrow">02 · Your enterprise</div>
            <div className="field"><label>Business name</label><input value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="e.g. Nova Foods" /></div>
            <div className="field"><label>What problem are you solving?</label><textarea value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="Describe the product, service or problem you want to solve..." /></div>
            <div className="field"><label>Industry</label><select value={industry} onChange={(event) => setIndustry(event.target.value)}>{industries.map((item) => <option key={item}>{item}</option>)}</select></div>
          </section>

          <section className="step card">
            <div className="eyebrow">03 · How will you build?</div>
            <p className="muted">Your structure changes capital, operating costs, control and coordination.</p>
            <div className="structures">
              {structures.map((item) => <button key={item.id} className={`structure ${structure === item.id ? "selected" : ""}`} onClick={() => setStructure(item.id)}>
                <strong>{item.name}</strong><span>{item.capital} starting capital</span><span>{item.description}</span>
              </button>)}
            </div>
            {structure !== "sole_trader" && <div className="field"><label>Co-founders, separated by commas</label><input value={partners} onChange={(event) => setPartners(event.target.value)} placeholder={structure === "partnership" ? "e.g. Aarav" : structure === "trio" ? "e.g. Aarav, Mira" : "e.g. Aarav, Mira, Kabir"} /><span className="muted">Maximum founders for this structure: {structure === "partnership" ? 2 : structure === "trio" ? 3 : 6}. First founder is CEO.</span></div>}
          </section>

          <div className="onboard-footer">
            <span className="pill">Starting capital · {selected.capital}</span>
            <button className="primary" onClick={launch} disabled={!founder.trim() || !businessName.trim() || !idea.trim()}>Start Day 1 →</button>
          </div>
        </div>
      </main>
    );
  }

  const event = state.events[0];
  const profit = state.business.revenue - state.business.expenses;
  const choose = (choice: SimulationChoice) => setState((current) => current ? applyChoice(current, choice) : current);
  const nextDay = () => setState((current) => current ? advanceDay(current) : current);

  return (
    <main className="shell">
      <header className="topbar"><div className="brand">ENTERPRISEVERSE</div><div className="day">Day {state.business.day} · {state.business.structure.replace("_", " ")}</div></header>
      <div className="content">
        <section className="hero"><div><div className="eyebrow">{state.business.industry} · Your enterprise</div><h1>{state.business.name}</h1><div className="muted">{state.business.idea}</div></div><button className="primary" onClick={nextDay} disabled={Boolean(event)}>End Day →</button></section>
        <section className="stats">
          <div className="card"><div className="stat-label">CASH</div><div className="stat-value">₹{state.business.cash.toLocaleString("en-IN")}</div></div>
          <div className="card"><div className="stat-label">REVENUE</div><div className="stat-value">₹{state.business.revenue.toLocaleString("en-IN")}</div></div>
          <div className="card"><div className="stat-label">PROFIT</div><div className="stat-value">₹{profit.toLocaleString("en-IN")}</div></div>
          <div className="card"><div className="stat-label">CUSTOMERS</div><div className="stat-value">{state.business.customers.length}</div></div>
          <div className="card"><div className="stat-label">REPUTATION</div><div className="stat-value">{state.business.reputation}/100</div></div>
        </section>
        <section className="grid">
          <div className="card">{event ? <><div className="eyebrow">A decision has arrived</div><div className="event-title">{event.title}</div><div className="muted">{event.message}</div><div className="options">{event.choices.map((choice) => <button className="option" key={choice.id} onClick={() => choose(choice)}><strong>{choice.label}</strong><span>Make this call and accept its consequences.</span></button>)}</div></> : <><div className="eyebrow">Decision recorded</div><div className="event-title">Your choice changed the business.</div><div className="muted">Review the consequences, then advance to the next day.</div><div style={{ marginTop: 18 }}><button className="primary" onClick={nextDay}>Continue to Day {state.business.day + 1}</button></div></>}</div>
          <div className="card"><div className="eyebrow">Founder log</div><div className="log">{[...state.log].reverse().map((entry, index) => <div className="log-item" key={`${entry}-${index}`}>{entry}</div>)}</div></div>
        </section>
      </div>
    </main>
  );
}
