"use client";

import { useMemo, useState } from "react";
import { applyDecision, createBusiness, createInitialState, endDay } from "@enterpriseverse/simulation/src/engine";
import type { BusinessStructure, Founder, SimulationState } from "@enterpriseverse/simulation/src/types";

const founder: Founder = { id: "founder-1", name: "Founder", role: "CEO" };

export default function Home() {
  const initial = useMemo(() => createInitialState(createBusiness({ name: "Nova Ventures", structure: "sole_trader", founders: [founder] })), []);
  const [state, setState] = useState<SimulationState>(initial);

  const choose = (optionId: string) => setState((current) => applyDecision(current, optionId));
  const nextDay = () => setState((current) => endDay(current));
  const profit = state.business.revenue - state.business.expenses;

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">ENTERPRISEVERSE</div>
        <div className="day">Day {state.business.day} · {state.business.structure.replace("_", " ")}</div>
      </header>
      <div className="content">
        <section className="hero">
          <div><div className="eyebrow">Your enterprise</div><h1>{state.business.name}</h1><div className="muted">Observe the market. Make the call. Live with the consequence.</div></div>
          <button className="primary" onClick={nextDay} disabled={Boolean(state.currentEvent)}>End Day →</button>
        </section>

        <section className="stats">
          <div className="card"><div className="stat-label">CASH</div><div className="stat-value">₹{state.business.cash.toLocaleString()}</div></div>
          <div className="card"><div className="stat-label">REVENUE</div><div className="stat-value">₹{state.business.revenue.toLocaleString()}</div></div>
          <div className="card"><div className="stat-label">PROFIT</div><div className="stat-value">₹{profit.toLocaleString()}</div></div>
          <div className="card"><div className="stat-label">CUSTOMERS</div><div className="stat-value">{state.business.customers}</div></div>
          <div className="card"><div className="stat-label">REPUTATION</div><div className="stat-value">{state.business.reputation}/100</div></div>
        </section>

        <section className="grid">
          <div className="card">
            {state.currentEvent ? <>
              <div className="eyebrow">A decision has arrived</div>
              <div className="event-title">{state.currentEvent.title}</div>
              <div className="muted">{state.currentEvent.description}</div>
              <div className="options">
                {state.currentEvent.options.map((option) => <button className="option" key={option.id} onClick={() => choose(option.id)}>
                  <strong>{option.label}</strong><span>{option.description}</span>
                </button>)}
              </div>
            </> : <>
              <div className="eyebrow">Decision recorded</div>
              <div className="event-title">Your choice changed the business.</div>
              <div className="muted">Review the consequences, then end the day to discover what the market does next.</div>
            </>}
          </div>
          <div className="card">
            <div className="eyebrow">Founder log</div>
            <div className="log">{[...state.history].reverse().map((entry, index) => <div className="log-item" key={`${entry}-${index}`}>{entry}</div>)}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
