"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildEnterpriseBrief, runWhatIf, type AdvisorRole, type EnterpriseBrief, type WhatIfResult } from "@enterpriseverse/simulation";
import CanonicalShell from "../experience/CanonicalShell";
import { useSimulation } from "../lib/simulation/useSimulation";
import "./intelligence.css";

const roles: Array<{ id: AdvisorRole; label: string; short: string }> = [
  { id: "ceo", label: "CEO Advisor", short: "Strategy" },
  { id: "cfo", label: "CFO Advisor", short: "Finance" },
  { id: "cmo", label: "CMO Advisor", short: "Market" },
  { id: "coo", label: "COO Advisor", short: "Operations" },
  { id: "cto", label: "CTO Advisor", short: "Product" },
  { id: "chro", label: "CHRO Advisor", short: "People" },
];

const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

export default function IntelligencePage() {
  const { state, status, error } = useSimulation();
  const [role, setRole] = useState<AdvisorRole>("ceo");
  const [priceDeltaPct, setPriceDeltaPct] = useState("0");
  const [marketingBudget, setMarketingBudget] = useState("1000");
  const [qualityInvestment, setQualityInvestment] = useState("0");
  const [hiring, setHiring] = useState("0");
  const [debtPayment, setDebtPayment] = useState("0");
  const [whatIf, setWhatIf] = useState<WhatIfResult | null>(null);

  const brief: EnterpriseBrief | null = useMemo(() => {
    if (!state) return null;
    return buildEnterpriseBrief(state, role);
  }, [state, role]);

  function runScenario() {
    if (!state) return;
    setWhatIf(runWhatIf(state, {
      priceDeltaPct: Number(priceDeltaPct) || 0,
      marketingBudget: Number(marketingBudget) || 0,
      qualityInvestment: Number(qualityInvestment) || 0,
      hiring: Number(hiring) || 0,
      debtPayment: Number(debtPayment) || 0,
    }));
  }

  if (!state || !brief) {
    return (
      <main className="intelligence-page">
        <section className="intelligence-empty">
          <div className="intel-eyebrow">ENTERPRISE INTELLIGENCE</div>
          <h1>{status === "error" ? "Your enterprise could not be loaded." : "Loading your command center…"}</h1>
          <p>{error ?? "Intelligence is connecting to the canonical simulation state."}</p>
          <Link className="intel-primary" href="/founder">Open Founder Mode →</Link>
        </section>
      </main>
    );
  }

  return (
    <CanonicalShell state={state} syncStatus={status}>
      <main className="intelligence-page">
        <header className="intel-header">
          <div>
            <div className="intel-eyebrow">PHASE 6 · ENTERPRISE INTELLIGENCE</div>
            <h1>{state.business.name} command center</h1>
            <p>Evidence-based guidance, role-aware analysis and safe what-if scenarios built directly from the canonical simulation state.</p>
          </div>
          <div className="intel-header-actions"><Link className="intel-secondary" href="/learning">Learning hub</Link><Link className="intel-secondary" href="/day1">Back to enterprise</Link></div>
        </header>

        <section className="role-switcher" aria-label="Advisor role">
          {roles.map((item) => <button key={item.id} type="button" className={role === item.id ? "role-button active" : "role-button"} onClick={() => { setRole(item.id); setWhatIf(null); }}><strong>{item.label}</strong><span>{item.short}</span></button>)}
        </section>

        <section className="intel-grid">
          <article className="intel-card intel-hero">
            <div className="intel-eyebrow">Advisor brief</div>
            <div className="hero-row"><div><h2>{brief.headline}</h2><p>{brief.summary}</p></div><div className="health-score"><strong>{brief.healthScore}</strong><span>business health</span></div></div>
            <div className="metric-grid">{brief.metrics.map((metric) => <div className="metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></div>)}</div>
          </article>

          <article className="intel-card priorities-card">
            <div className="intel-eyebrow">Priorities</div>
            <h2>What deserves attention?</h2>
            <div className="priority-list">{brief.priorities.map((item) => <div className={`priority ${item.severity}`} key={item.id}><div className="priority-head"><span className="severity-dot" /><div><strong>{item.title}</strong><span>{item.role.toUpperCase()} · {item.severity}</span></div>{item.metric && <b>{item.metric.value}</b>}</div><p>{item.evidence}</p><div className="recommendation"><strong>Recommendation</strong><span>{item.recommendation}</span></div><div className="rationale"><strong>Why</strong><span>{item.rationale}</span></div></div>)}</div>
          </article>

          <article className="intel-card scenario-card">
            <div className="intel-eyebrow">Safe what-if workspace</div>
            <h2>Test a decision before committing</h2>
            <p>These projections are calculated from the canonical simulation and never change your real company.</p>
            <div className="scenario-controls">
              <label>Price change (%)<input type="number" value={priceDeltaPct} onChange={(event) => setPriceDeltaPct(event.target.value)} step="1" /></label>
              <label>Marketing budget<input type="number" value={marketingBudget} onChange={(event) => setMarketingBudget(event.target.value)} min="0" step="100" /></label>
              <label>Quality investment<input type="number" value={qualityInvestment} onChange={(event) => setQualityInvestment(event.target.value)} min="0" step="100" /></label>
              <label>New hires<input type="number" value={hiring} onChange={(event) => setHiring(event.target.value)} min="0" step="1" /></label>
              <label>Debt payment<input type="number" value={debtPayment} onChange={(event) => setDebtPayment(event.target.value)} min="0" step="500" /></label>
            </div>
            <button type="button" className="intel-primary" onClick={runScenario}>Run scenario →</button>
            {whatIf && <div className="scenario-result">
              <div className="result-banner"><strong>{whatIf.confidence.toUpperCase()} CONFIDENCE</strong><span>Directional planning only — the real simulation is unchanged.</span></div>
              <div className="result-grid">{[
                ["Cash", money(whatIf.projected.cash), whatIf.deltas.cash],
                ["Revenue", money(whatIf.projected.revenue), whatIf.deltas.revenue],
                ["Net profit", money(whatIf.projected.netProfit), whatIf.deltas.netProfit],
                ["Customers", `${whatIf.projected.customers}`, whatIf.deltas.customers],
                ["Market share", `${whatIf.projected.marketShare.toFixed(1)}%`, whatIf.deltas.marketShare],
                ["Reputation", `${whatIf.projected.reputation.toFixed(1)}/100`, whatIf.deltas.reputation],
              ].map(([label, value, delta]) => <div className="result-metric" key={String(label)}><span>{label}</span><strong>{String(value)}</strong><small className={Number(delta) >= 0 ? "positive" : "negative"}>{Number(delta) >= 0 ? "+" : ""}{typeof delta === "number" && Math.abs(delta) >= 1 ? Math.round(delta).toLocaleString("en-IN") : Number(delta).toFixed(1)}</small></div>)}</div>
              {whatIf.warnings.length > 0 && <div className="warning-box"><strong>Warnings</strong>{whatIf.warnings.map((warning) => <span key={warning}>{warning}</span>)}</div>}
            </div>}
          </article>
        </section>

        <footer className="intel-footer"><span>Advisor mode uses deterministic simulation intelligence. No private company data is sent to an external AI provider.</span><Link href="/learning">Continue learning →</Link></footer>
      </main>
    </CanonicalShell>
  );
}
