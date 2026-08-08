"use client";

import { useMemo, useState } from "react";
import { advanceDay, applyChoice, createBusiness } from "@enterpriseverse/simulation";
import type { SimulationChoice, SimulationState } from "@enterpriseverse/types";

export default function Home() {
  const initial = useMemo(() => createBusiness({
    name: "Nova Ventures",
    structure: "sole_trader",
    founderNames: ["Shlok"],
  }), []);
  const [state, setState] = useState<SimulationState>(initial);
  const event = state.events[0];
  const profit = state.business.revenue - state.business.expenses;

  const choose = (choice: SimulationChoice) => setState((current) => applyChoice(current, choice));
  const nextDay = () => setState((current) => advanceDay(current));

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">ENTERPRISEVERSE</div>
        <div className="day">Day {state.business.day} · {state.business.structure.replace("_", " ")}</div>
      </header>
      <div className="content">
        <section className="hero">
          <div>
            <div className="eyebrow">Your enterprise</div>
            <h1>{state.business.name}</h1>
            <div className="muted">Observe the market. Make the call. Live with the consequence.</div>
          </div>
          <button className="primary" onClick={nextDay} disabled={Boolean(event)}>End Day →</button>
        </section>

        <section className="stats">
          <div className="card"><div className="stat-label">CASH</div><div className="stat-value">₹{state.business.cash.toLocaleString("en-IN")}</div></div>
          <div className="card"><div className="stat-label">REVENUE</div><div className="stat-value">₹{state.business.revenue.toLocaleString("en-IN")}</div></div>
          <div className="card"><div className="stat-label">PROFIT</div><div className="stat-value">₹{profit.toLocaleString("en-IN")}</div></div>
          <div className="card"><div className="stat-label">CUSTOMERS</div><div className="stat-value">{state.business.customers.length}</div></div>
          <div className="card"><div className="stat-label">REPUTATION</div><div className="stat-value">{state.business.reputation}/100</div></div>
        </section>

        <section className="grid">
          <div className="card">
            {event ? <>
              <div className="eyebrow">A decision has arrived</div>
              <div className="event-title">{event.title}</div>
              <div className="muted">{event.message}</div>
              <div className="options">
                {event.choices.map((choice) => <button className="option" key={choice.id} onClick={() => choose(choice)}>
                  <strong>{choice.label}</strong>
                  <span>Make this call and accept its consequences.</span>
                </button>)}
              </div>
            </> : <>
              <div className="eyebrow">Decision recorded</div>
              <div className="event-title">Your choice changed the business.</div>
              <div className="muted">Review the consequences, then end the day to discover what the market does next.</div>
              <div style={{ marginTop: 18 }}><button className="primary" onClick={nextDay}>Continue to Day {state.business.day + 1}</button></div>
            </>}
          </div>
          <div className="card">
            <div className="eyebrow">Founder log</div>
            <div className="log">{[...state.log].reverse().map((entry, index) => <div className="log-item" key={`${entry}-${index}`}>{entry}</div>)}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
