"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Phase5ESG, Phase5InvestorType, Phase5Regulation, SimulationState } from "@enterpriseverse/types";
import {
  addPhase5Contract,
  addPhase5Partnership,
  applyPhase5Acquisition,
  applyPhase5Financing,
  calculatePhase5Snapshot,
  ensurePhase5State,
  previewPhase5Acquisition,
  previewPhase5Financing,
  setPhase5ESG,
  setPhase5Regulation,
} from "@enterpriseverse/simulation";
import type { Phase5AcquisitionInput, Phase5FinancingInput } from "@enterpriseverse/simulation";
import { useAccount } from "../auth-provider";
import "./strategy.css";

const SAVE_KEY = "enterpriseverse:active-business:v1";
const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
const pct = (value: number) => `${Math.round(value)}%`;

type Tab = "overview" | "finance" | "governance" | "contracts" | "risk";

function initialState(): SimulationState | null {
  return null;
}

export default function StrategyPage() {
  const { user, authReady, cloudReady, loadBusiness, saveBusiness } = useAccount();
  const [state, setState] = useState<SimulationState | null>(initialState);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [financingType, setFinancingType] = useState<"equity" | "debt">("equity");
  const [financingAmount, setFinancingAmount] = useState("25000");
  const [investorType, setInvestorType] = useState<Phase5InvestorType>("venture_capital");
  const [interestRate, setInterestRate] = useState("10");
  const [acquisitionTarget, setAcquisitionTarget] = useState("Nova Systems");
  const [acquisitionPrice, setAcquisitionPrice] = useState("120000");
  const [targetRevenue, setTargetRevenue] = useState("45000");
  const [targetShare, setTargetShare] = useState("3");
  const [synergy, setSynergy] = useState("75");
  const [diligence, setDiligence] = useState("85");
  const [contractCounterparty, setContractCounterparty] = useState("");
  const [contractValue, setContractValue] = useState("15000");
  const [contractTerm, setContractTerm] = useState("180");
  const [partnershipName, setPartnershipName] = useState("");
  const [partnershipValue, setPartnershipValue] = useState("12000");
  const [partnershipScore, setPartnershipScore] = useState("70");

  useEffect(() => {
    if (!authReady) return;
    let active = true;
    setLoading(true);
    void loadBusiness<SimulationState>(SAVE_KEY)
      .then((saved) => {
        if (!active) return;
        if (saved?.business?.name) setState(saved);
        else setState(null);
      })
      .catch(() => {
        if (active) setState(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [authReady, loadBusiness, user?.id]);

  const strategy = useMemo(() => (state ? ensurePhase5State(state) : null), [state]);
  const snapshot = useMemo(() => (state ? calculatePhase5Snapshot(state) : null), [state]);
  const financingPreview = useMemo(() => {
    if (!state) return null;
    const input: Phase5FinancingInput = {
      type: financingType,
      amount: Number(financingAmount),
      investorType: financingType === "equity" ? investorType : undefined,
      interestRate: Number(interestRate),
      termDays: 365,
    };
    try { return previewPhase5Financing(state, input); } catch { return null; }
  }, [state, financingAmount, financingType, investorType, interestRate]);
  const acquisitionPreview = useMemo(() => {
    if (!state) return null;
    const input: Phase5AcquisitionInput = {
      targetName: acquisitionTarget,
      purchasePrice: Number(acquisitionPrice),
      targetRevenue: Number(targetRevenue),
      targetMarketShare: Number(targetShare),
      synergyScore: Number(synergy),
      dueDiligenceScore: Number(diligence),
      financingType: "cash",
    };
    try { return previewPhase5Acquisition(state, input); } catch { return null; }
  }, [state, acquisitionTarget, acquisitionPrice, targetRevenue, targetShare, synergy, diligence]);

  async function commit(next: SimulationState, success: string) {
    setState(next);
    await saveBusiness(SAVE_KEY, next);
    setMessage(success);
  }

  async function run(name: string, action: () => SimulationState, success: string) {
    if (!state) return;
    setBusy(name); setError(""); setMessage("");
    try {
      const next = action();
      await commit(next, success);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Strategy action could not be completed.");
    } finally {
      setBusy("");
    }
  }

  if (!user) return <main className="strategy-shell"><section className="strategy-card centered"><span className="strategy-kicker">ENTERPRISEVERSE · STRATEGY</span><h1>Own the next stage of the company.</h1><p>Sign in to manage financing, investors, governance, risk and strategic transactions.</p><Link className="strategy-primary" href="/auth/signin">Sign in →</Link></section></main>;
  if (loading) return <main className="strategy-shell"><section className="strategy-card centered"><div className="strategy-spinner" /><p>Loading your strategy console…</p></section></main>;
  if (!state || !strategy || !snapshot) return <main className="strategy-shell"><section className="strategy-card centered"><span className="strategy-kicker">NO ACTIVE ENTERPRISE</span><h1>Build a company before entering strategy.</h1><p>Your Phase 5 console attaches directly to the active simulation.</p><Link className="strategy-primary" href="/enterprise">Build your enterprise →</Link></section></main>;

  const activeEsg: Phase5ESG = strategy.esg;
  const activeRegulation: Phase5Regulation = strategy.regulation;

  return (
    <main className="strategy-shell">
      <header className="strategy-header">
        <div><Link className="strategy-brand" href="/">ENTERPRISEVERSE</Link><span className="strategy-kicker">PHASE 5 · ADVANCED ENTERPRISE STRATEGY</span><h1>{state.business.name}</h1><p>{state.business.industry} · Day {state.business.day} · Strategy Console</p></div>
        <nav><Link href="/company">Company</Link><Link href="/world">World</Link><Link href="/career">Career</Link><Link href="/competition">Competition</Link></nav>
      </header>

      <section className="strategy-hero">
        <div><span className="strategy-kicker">CAPITAL + GOVERNANCE + RISK</span><h2>Build the company that can survive its own growth.</h2><p>Every strategy action is calculated from the canonical simulation state, previewed before commit, and persisted through the existing business save pipeline.</p></div>
        <div className={`risk-chip ${snapshot.risk.level}`}><span>Risk</span><strong>{Math.round(snapshot.risk.overall)}/100</strong><small>{snapshot.risk.level.toUpperCase()}</small></div>
      </section>

      <section className="strategy-metrics">
        <article><span>VALUATION</span><strong>{money(snapshot.valuation)}</strong><small>{snapshot.roundLabel}</small></article>
        <article><span>FOUNDER OWNERSHIP</span><strong>{pct(snapshot.founderOwnership)}</strong><small>Control position</small></article>
        <article><span>DEBT</span><strong>{money(snapshot.debt)}</strong><small>{money(snapshot.annualInterestCost)}/yr interest</small></article>
        <article><span>CASH</span><strong>{money(snapshot.cash)}</strong><small>{Math.round(snapshot.runwayDays)} day runway</small></article>
        <article><span>INVESTORS</span><strong>{strategy.investors.length}</strong><small>{snapshot.board.occupiedSeats}/{snapshot.board.seats} board seats</small></article>
      </section>

      <nav className="strategy-tabs" aria-label="Strategy sections">
        {(["overview", "finance", "governance", "contracts", "risk"] as Tab[]).map((item) => <button key={item} type="button" className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item === "overview" ? "Overview" : item[0].toUpperCase() + item.slice(1)}</button>)}
      </nav>

      {tab === "overview" && <div className="strategy-grid">
        <section className="strategy-card strategy-card-large"><div className="section-head"><div><span className="strategy-kicker">CAPITAL STRATEGY</span><h2>Funding runway</h2></div><span className="mini-pill">{snapshot.roundLabel}</span></div><div className="capital-layout"><div><strong>{money(snapshot.cash)}</strong><span>available cash</span></div><div><strong>{money(snapshot.valuation)}</strong><span>current valuation</span></div><div><strong>{pct(snapshot.founderOwnership)}</strong><span>founder ownership</span></div></div><div className="strategy-note">Raise capital when it accelerates a credible operating plan—not simply because cash is available.</div><button className="strategy-primary" onClick={() => setTab("finance")}>Open finance console →</button></section>
        <section className="strategy-card"><div className="section-head"><div><span className="strategy-kicker">RISK</span><h2>Enterprise risk</h2></div></div>{(["liquidity","leverage","concentration","operational","regulatory","reputation"] as const).map((key) => <div className="risk-row" key={key}><span>{key}</span><div><i style={{ width: `${snapshot.risk[key]}%` }} /></div><b>{Math.round(snapshot.risk[key])}</b></div>)}</section>
        <section className="strategy-card"><div className="section-head"><div><span className="strategy-kicker">GOVERNANCE</span><h2>Board</h2></div><button className="link-button" onClick={() => setTab("governance")}>Manage →</button></div><p>{strategy.board.occupiedSeats} of {strategy.board.seats} seats occupied. Major strategy should become more governed as enterprise scale increases.</p><div className="board-list">{strategy.board.members.map((member) => <div key={member.name}><span>{member.name}</span><small>{member.role}</small><b>{member.votingPower}%</b></div>)}</div></section>
        <section className="strategy-card"><div className="section-head"><div><span className="strategy-kicker">ESG + COMPLIANCE</span><h2>Trust layer</h2></div><button className="link-button" onClick={() => setTab("risk")}>Review →</button></div><div className="trust-grid"><div><span>ESG</span><strong>{Math.round(activeEsg.sustainabilityScore)}</strong></div><div><span>Compliance</span><strong>{Math.round(activeRegulation.complianceScore)}</strong></div><div><span>Issues</span><strong>{activeRegulation.unresolvedIssues}</strong></div></div></section>
      </div>}

      {tab === "finance" && <div className="strategy-grid">
        <section className="strategy-card strategy-card-large"><div className="section-head"><div><span className="strategy-kicker">01 · FUNDING</span><h2>Raise capital</h2><p>Compare equity dilution against debt service before committing.</p></div></div><div className="form-grid"><label>Type<select value={financingType} onChange={(e) => setFinancingType(e.target.value as "equity" | "debt")}><option value="equity">Equity</option><option value="debt">Debt</option></select></label><label>Amount<input type="number" min="1" value={financingAmount} onChange={(e) => setFinancingAmount(e.target.value)} /></label>{financingType === "equity" ? <label>Investor type<select value={investorType} onChange={(e) => setInvestorType(e.target.value as Phase5InvestorType)}><option value="angel">Angel</option><option value="venture_capital">Venture Capital</option><option value="private_equity">Private Equity</option><option value="strategic">Strategic Investor</option></select></label> : <label>Interest rate %<input type="number" min="3" max="28" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} /></label>}</div>{financingPreview && <div className={`preview ${financingPreview.allowed ? "good" : "bad"}`}><div><span>Pre-money</span><b>{money(financingPreview.preMoneyValuation)}</b></div><div><span>Post-money</span><b>{money(financingPreview.postMoneyValuation)}</b></div><div><span>Founder ownership</span><b>{pct(financingPreview.ownershipFounderAfter)}</b></div><div><span>Projected risk</span><b>{financingPreview.projectedRisk.level}</b></div><p>{financingPreview.reason}</p></div>}<button className="strategy-primary" disabled={busy === "finance" || !financingPreview?.allowed} onClick={() => void run("finance", () => applyPhase5Financing(state, { type: financingType, amount: Number(financingAmount), investorType: financingType === "equity" ? investorType : undefined, interestRate: Number(interestRate), termDays: 365 }), "Financing committed to the enterprise state.")}>{busy === "finance" ? "Committing…" : "Commit financing →"}</button></section>
        <section className="strategy-card"><div className="section-head"><div><span className="strategy-kicker">02 · HISTORY</span><h2>Financing history</h2></div></div>{strategy.financingHistory.length ? strategy.financingHistory.slice().reverse().map((record) => <div className="history-row" key={record.id}><div><strong>{record.type === "equity" ? "Equity raise" : "Debt financing"}</strong><small>Day {record.day}</small></div><b>{money(record.amount)}</b><span>{record.type === "equity" ? `${record.dilutionPercent}% dilution` : `${record.interestRate}% interest`}</span></div>) : <div className="empty">No external financing yet. The company is bootstrapped.</div>}</section>
        <section className="strategy-card strategy-card-wide"><div className="section-head"><div><span className="strategy-kicker">03 · M&A</span><h2>Acquisition workspace</h2><p>Acquisitions unlock only after the company reaches mature operating scale.</p></div></div><div className="form-grid four"><label>Target<input value={acquisitionTarget} onChange={(e) => setAcquisitionTarget(e.target.value)} /></label><label>Price<input type="number" min="1" value={acquisitionPrice} onChange={(e) => setAcquisitionPrice(e.target.value)} /></label><label>Target revenue<input type="number" min="0" value={targetRevenue} onChange={(e) => setTargetRevenue(e.target.value)} /></label><label>Target share %<input type="number" min="0" value={targetShare} onChange={(e) => setTargetShare(e.target.value)} /></label><label>Synergy /100<input type="number" min="0" max="100" value={synergy} onChange={(e) => setSynergy(e.target.value)} /></label><label>Due diligence /100<input type="number" min="0" max="100" value={diligence} onChange={(e) => setDiligence(e.target.value)} /></label></div>{acquisitionPreview && <div className={`preview ${acquisitionPreview.allowed ? "good" : "bad"}`}><div><span>Projected revenue</span><b>+{money(acquisitionPreview.projectedRevenueGain)}</b></div><div><span>Market share</span><b>+{acquisitionPreview.projectedMarketShareGain.toFixed(2)}%</b></div><div><span>Risk</span><b>{acquisitionPreview.projectedRisk.level}</b></div><p>{acquisitionPreview.reason}</p></div>}<button className="strategy-primary" disabled={busy === "acquisition" || !acquisitionPreview?.allowed} onClick={() => void run("acquisition", () => applyPhase5Acquisition(state, { targetName: acquisitionTarget, purchasePrice: Number(acquisitionPrice), targetRevenue: Number(targetRevenue), targetMarketShare: Number(targetShare), synergyScore: Number(synergy), dueDiligenceScore: Number(diligence), financingType: "cash" }), "Acquisition completed and integrated into the simulation.")}>{busy === "acquisition" ? "Closing…" : "Complete acquisition →"}</button></section>
      </div>}

      {tab === "governance" && <div className="strategy-grid">
        <section className="strategy-card strategy-card-large"><div className="section-head"><div><span className="strategy-kicker">BOARD ROOM</span><h2>Governance structure</h2><p>Board power grows as outside capital enters the company.</p></div></div><div className="board-hero"><strong>{snapshot.board.occupiedSeats}/{snapshot.board.seats}</strong><span>occupied seats</span><b>{snapshot.board.approvalThresholdPercent}%</b><small>approval threshold</small></div><div className="board-list large">{strategy.board.members.map((member) => <div key={member.name}><div><strong>{member.name}</strong><small>{member.role}</small></div><b>{member.votingPower}%</b></div>)}</div></section>
        <section className="strategy-card"><div className="section-head"><div><span className="strategy-kicker">PARTNERSHIPS</span><h2>Strategic partnerships</h2></div></div><div className="form-grid"><label>Partner<input value={partnershipName} onChange={(e) => setPartnershipName(e.target.value)} placeholder="e.g. Retail Network" /></label><label>Annual value<input type="number" min="0" value={partnershipValue} onChange={(e) => setPartnershipValue(e.target.value)} /></label><label>Strategic value /100<input type="number" min="0" max="100" value={partnershipScore} onChange={(e) => setPartnershipScore(e.target.value)} /></label></div><button className="strategy-primary" disabled={busy === "partnership" || partnershipName.trim().length < 2} onClick={() => void run("partnership", () => addPhase5Partnership(state, { partner: partnershipName.trim(), strategicValue: Number(partnershipScore), annualValue: Number(partnershipValue), exclusivity: false, termDays: 365 }), "Partnership activated.")}>{busy === "partnership" ? "Activating…" : "Activate partnership →"}</button></section>
      </div>}

      {tab === "contracts" && <div className="strategy-grid">
        <section className="strategy-card"><div className="section-head"><div><span className="strategy-kicker">CONTRACTS</span><h2>Activate a contract</h2></div></div><div className="form-grid"><label>Counterparty<input value={contractCounterparty} onChange={(e) => setContractCounterparty(e.target.value)} placeholder="Supplier / Distributor" /></label><label>Contract value<input type="number" min="0" value={contractValue} onChange={(e) => setContractValue(e.target.value)} /></label><label>Term (days)<input type="number" min="1" value={contractTerm} onChange={(e) => setContractTerm(e.target.value)} /></label></div><button className="strategy-primary" disabled={busy === "contract" || contractCounterparty.trim().length < 2} onClick={() => void run("contract", () => addPhase5Contract(state, { counterparty: contractCounterparty.trim(), type: "supplier", value: Number(contractValue), termDays: Number(contractTerm), penaltyPercent: 5 }), "Contract activated.")}>{busy === "contract" ? "Activating…" : "Activate contract →"}</button></section>
        <section className="strategy-card"><div className="section-head"><div><span className="strategy-kicker">ACTIVE COMMITMENTS</span><h2>{strategy.contracts.length} contracts</h2></div></div>{strategy.contracts.length ? strategy.contracts.map((contract) => <div className="history-row" key={contract.id}><div><strong>{contract.counterparty}</strong><small>{contract.type} · {contract.termDays} days</small></div><b>{money(contract.value)}</b><span>{contract.status}</span></div>) : <div className="empty">No strategic contracts have been activated.</div>}</section>
      </div>}

      {tab === "risk" && <div className="strategy-grid">
        <section className="strategy-card"><div className="section-head"><div><span className="strategy-kicker">RISK REGISTER</span><h2>Company risk</h2></div></div>{(["liquidity","leverage","concentration","operational","regulatory","reputation"] as const).map((key) => <div className="risk-row" key={key}><span>{key}</span><div><i style={{ width: `${strategy.risks[key]}%` }} /></div><b>{Math.round(strategy.risks[key])}</b></div>)}<div className="risk-summary"><strong>{strategy.risks.level.toUpperCase()}</strong><span>overall risk state</span></div></section>
        <section className="strategy-card"><div className="section-head"><div><span className="strategy-kicker">ESG</span><h2>Sustainability profile</h2></div></div>{(["environmental","social","governance"] as const).map((key) => <label key={key}>{key}<input type="range" min="0" max="100" value={activeEsg[key]} onChange={(e) => { const next: Phase5ESG = { ...activeEsg, [key]: Number(e.target.value), sustainabilityScore: activeEsg.sustainabilityScore }; setState((current) => current ? { ...current, phase5: { ...ensurePhase5State(current), esg: next } } : current); }} /></label>)}<button className="strategy-secondary" onClick={() => { if (state) void commit(setPhase5ESG(state, activeEsg), "ESG profile committed."); }}>Save ESG profile</button></section>
        <section className="strategy-card"><div className="section-head"><div><span className="strategy-kicker">REGULATION</span><h2>Compliance</h2></div></div><label>Compliance score<input type="range" min="0" max="100" value={activeRegulation.complianceScore} onChange={(e) => setState((current) => current ? { ...current, phase5: { ...ensurePhase5State(current), regulation: { ...activeRegulation, complianceScore: Number(e.target.value) } } } : current)} /></label><label>Unresolved issues<input type="number" min="0" value={activeRegulation.unresolvedIssues} onChange={(e) => setState((current) => current ? { ...current, phase5: { ...ensurePhase5State(current), regulation: { ...activeRegulation, unresolvedIssues: Number(e.target.value) } } } : current)} /></label><button className="strategy-secondary" onClick={() => { if (state) void commit(setPhase5Regulation(state, activeRegulation), "Regulatory profile committed."); }}>Save compliance profile</button></section>
      </div>}

      {(message || error) && <div className={error ? "strategy-toast error" : "strategy-toast success"} role={error ? "alert" : "status"}>{error || message}</div>}
      <footer className="strategy-footer"><span>{cloudReady ? "Cloud save connected" : "Local-first mode"}</span><span>Phase 5 state persists with the active enterprise save.</span></footer>
    </main>
  );
}
