"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPlayerBootstrap } from "../competition/competition-browser";
import { getStoredUser } from "../lib/supabase-browser";
import { actOnProposal, createProposal, loadCompanyWorkspace } from "./company-browser";
import type { BusinessProposal, CompanyWorkspace, CompanyRole } from "./company-browser";
import "./company.css";

type DepartmentKey = "finance" | "marketing" | "operations" | "technology" | "people";
type View = "overview" | DepartmentKey | "proposals";

const departmentMeta: Record<DepartmentKey, { short: string; title: string; description: string }> = {
  finance: { short: "CFO", title: "Finance", description: "Cash, budgets, funding and financial analysis." },
  marketing: { short: "CMO", title: "Marketing", description: "Customers, campaigns, pricing and growth." },
  operations: { short: "COO", title: "Operations", description: "Production, inventory, capacity and supply chain." },
  technology: { short: "CTO", title: "Technology", description: "Product, technology, R&D and innovation." },
  people: { short: "CHRO", title: "People", description: "Hiring, productivity, morale and culture." },
};

const roleLabel = (role: string) => ({ ceo: "CEO", cfo: "CFO", cmo: "CMO", coo: "COO", cto: "CTO", chro: "CHRO", founder: "Co-founder", member: "Member", owner: "Owner" } as Record<string, string>)[role] ?? role.toUpperCase();
const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

export default function CompanyPage() {
  const user = getStoredUser();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<CompanyWorkspace | null>(null);
  const [view, setView] = useState<View>("overview");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [proposalDepartment, setProposalDepartment] = useState<DepartmentKey>("marketing");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [proposalAmount, setProposalAmount] = useState("50000");

  async function refresh(id: string) {
    setLoading(true); setError("");
    try { setWorkspace(await loadCompanyWorkspace(id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load your company."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let active = true;
    void getPlayerBootstrap().then((bootstrap) => {
      if (!active) return;
      const id = bootstrap?.profile?.current_business_id ?? bootstrap?.current_membership?.business_id ?? null;
      setBusinessId(id);
      if (id) void refresh(id);
      else setLoading(false);
    }).catch((reason) => { if (active) { setError(reason instanceof Error ? reason.message : "Unable to load company context."); setLoading(false); } });
    return () => { active = false; };
  }, [user?.id]);

  const membershipRole = workspace?.membership?.role ?? "member";
  const isExecutive = ["ceo", "cfo", "cmo", "coo", "cto", "chro"].includes(membershipRole);
  const pendingForMe = useMemo(() => workspace?.proposals.filter((proposal) => {
    if (!proposal.steps.length || !isExecutive) return false;
    const step = proposal.steps.find((item) => item.step_order === proposal.current_step);
    return proposal.status === "submitted" && step?.required_role === membershipRole;
  }) ?? [], [workspace, membershipRole, isExecutive]);

  async function submitProposal() {
    if (!businessId) return;
    setBusy("proposal"); setError(""); setMessage("");
    try {
      await createProposal({ businessId, departmentKey: proposalDepartment, proposalType: "business_decision", title: proposalTitle, description: proposalDescription, amount: Number(proposalAmount), expectedImpact: {} });
      setProposalTitle(""); setProposalDescription("");
      await refresh(businessId);
      setMessage("Proposal submitted. The required executive review chain is now active.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to submit proposal."); }
    finally { setBusy(""); }
  }

  async function decide(proposal: BusinessProposal, action: "approve" | "reject" | "request_changes") {
    setBusy(`${action}-${proposal.id}`); setError(""); setMessage("");
    try { await actOnProposal(proposal.id, action); if (businessId) await refresh(businessId); setMessage(action === "approve" ? "Proposal approved and advanced to the next authority." : action === "reject" ? "Proposal rejected." : "Proposal returned for changes."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update proposal."); }
    finally { setBusy(""); }
  }

  if (!user) return <main className="company-shell"><section className="company-card company-auth"><span className="company-kicker">ENTERPRISEVERSE</span><h1>Run the company.</h1><p>Sign in to access your executive workspace.</p><Link className="company-primary" href="/auth/signin">Sign in →</Link></section></main>;
  if (loading) return <main className="company-shell"><section className="company-loading"><span className="pulse" />Loading your executive command center…</section></main>;
  if (!businessId || !workspace) return <main className="company-shell"><section className="company-card company-auth"><span className="company-kicker">NO ACTIVE COMPANY</span><h1>Choose your next move.</h1><p>Create a company as a CEO or accept an executive invitation.</p><div className="company-actions"><Link className="company-primary" href="/enterprise?mode=founder">Build a business →</Link><Link className="company-secondary" href="/enterprise?mode=executive">Find a business →</Link></div>{error && <p className="company-error">{error}</p>}</section></main>;

  return <main className="company-shell">
    <header className="company-topbar">
      <div><Link href="/" className="company-brand">ENTERPRISEVERSE</Link><span className="company-sub">EXECUTIVE COMMAND CENTER</span></div>
      <div className="company-top-actions"><Link href="/enterprise">Team</Link><Link href="/competition">Competition</Link><Link href="/start">Change role</Link><span className="company-role">{roleLabel(membershipRole)} · {user.displayName}</span></div>
    </header>

    <div className="company-layout">
      <aside className="company-sidebar">
        <div className="company-kicker">COMMAND</div>
        <button className={view === "overview" ? "nav active" : "nav"} onClick={() => setView("overview")}>Overview</button>
        {Object.entries(departmentMeta).map(([key, meta]) => <button key={key} className={view === key ? "nav active" : "nav"} onClick={() => setView(key as DepartmentKey)}><span>{meta.title}</span><small>{meta.short}</small></button>)}
        <button className={view === "proposals" ? "nav active" : "nav"} onClick={() => setView("proposals")}>Proposals <b>{pendingForMe.length || ""}</b></button>
        <div className="sidebar-divider" />
        <div className="company-kicker">ORGANIZATION</div>
        <div className="side-metric"><span>Team</span><strong>{workspace.members.length}</strong></div>
        <div className="side-metric"><span>Structure</span><strong>{workspace.business.team_size}</strong></div>
        <div className="side-metric"><span>Model</span><strong>{workspace.settings?.approval_model ?? "centralized"}</strong></div>
      </aside>

      <section className="company-main">
        <div className="company-hero"><div><span className="company-kicker">{workspace.business.industry ?? "Enterprise"} · {workspace.business.stage}</span><h1>{workspace.business.name}</h1><p>Your role: <strong>{roleLabel(membershipRole)}</strong>. Every major decision follows company authority instead of client-side shortcuts.</p></div><div className="hero-badge"><strong>{pendingForMe.length}</strong><span>awaiting you</span></div></div>

        {view === "overview" && <>
          <section className="metrics-grid">
            <div className="metric"><span>Members</span><strong>{workspace.members.length}</strong><small>Executive seats in the company</small></div>
            <div className="metric"><span>Departments</span><strong>{workspace.departments.length}</strong><small>Core business functions</small></div>
            <div className="metric"><span>Open proposals</span><strong>{workspace.proposals.filter((p) => ["submitted","needs_changes"].includes(p.status)).length}</strong><small>Work in the decision pipeline</small></div>
            <div className="metric"><span>Approval model</span><strong>{workspace.settings?.approval_model === "delegated" ? "Delegated" : "Centralized"}</strong><small>How authority currently flows</small></div>
          </section>

          <section className="company-grid-two">
            <div className="company-card"><div className="section-head"><div><span className="company-kicker">EXECUTIVE TEAM</span><h2>Who owns what</h2></div><Link href="/enterprise">Manage team →</Link></div><div className="member-grid">{workspace.members.map((member) => <div className="member-card" key={member.user_id}><span className="avatar">{member.display_name.slice(0,1).toUpperCase()}</span><div><strong>{member.display_name}</strong><span>{roleLabel(member.role)}</span></div></div>)}</div></div>
            <div className="company-card"><div className="section-head"><div><span className="company-kicker">ATTENTION</span><h2>What needs you</h2></div></div>{pendingForMe.length ? <div className="attention-list">{pendingForMe.slice(0,4).map((proposal) => <div className="attention" key={proposal.id}><div><strong>{proposal.title}</strong><span>{roleLabel(proposal.steps.find((step) => step.step_order === proposal.current_step)?.required_role ?? "") } · {money(proposal.amount)}</span></div><button onClick={() => setView("proposals")}>Review →</button></div>)}</div> : <div className="empty">Nothing requires your approval right now. Use the time to strengthen your department.</div>}</div>
          </section>

          <section className="company-card timeline-card"><div className="section-head"><div><span className="company-kicker">COMPANY HISTORY</span><h2>Recent decisions</h2></div></div><div className="timeline">{workspace.events.slice(0,8).map((event) => <div className="timeline-row" key={event.id}><span className="timeline-dot" /><div><strong>{event.summary}</strong><small>{new Date(event.created_at).toLocaleString()}</small></div></div>)}</div></section>
        </>}

        {view !== "overview" && view !== "proposals" && <section className="company-card department-page"><div className="section-head"><div><span className="company-kicker">{departmentMeta[view as DepartmentKey].short}</span><h2>{departmentMeta[view as DepartmentKey].title}</h2><p>{departmentMeta[view as DepartmentKey].description}</p></div><span className="department-status">{workspace.members.find((member) => member.role === ({ finance: "cfo", marketing: "cmo", operations: "coo", technology: "cto", people: "chro" } as Record<string,string>)[view])?.display_name ?? "Open leadership seat"}</span></div><div className="department-body"><div className="department-callout"><strong>Department authority</strong><p>Your department's actions will become real simulation inputs in the next layers. Phase 2 establishes the organizational authority and review system first.</p></div><button className="company-primary" onClick={() => { setProposalDepartment(view as DepartmentKey); setView("proposals"); }}>Create a proposal →</button></div></section>}

        {view === "proposals" && <section className="company-grid-two proposals-layout"><div className="company-card"><div className="section-head"><div><span className="company-kicker">DECISION PIPELINE</span><h2>Business proposals</h2></div><span>{workspace.proposals.length} total</span></div><div className="proposal-list">{workspace.proposals.length ? workspace.proposals.map((proposal) => { const currentStep = proposal.steps.find((step) => step.step_order === proposal.current_step); const actionable = pendingForMe.some((item) => item.id === proposal.id); return <article className="proposal" key={proposal.id}><div className="proposal-head"><div><span className={`proposal-status ${proposal.status}`}>{proposal.status.replace("_", " ")}</span><h3>{proposal.title}</h3><p>{proposal.description || "No additional description."}</p></div><strong>{money(proposal.amount)}</strong></div><div className="proposal-meta"><span>{departmentMeta[proposal.department_key as DepartmentKey]?.short ?? proposal.department_key}</span><span>By {proposal.creator_name}</span><span>Step {proposal.current_step}/{proposal.steps.length || 1}</span></div><div className="approval-chain">{proposal.steps.map((step) => <span key={step.id} className={step.status}><b>{roleLabel(step.required_role)}</b><small>{step.status}</small></span>)}</div>{actionable && <div className="proposal-actions"><button disabled={busy === `approve-${proposal.id}`} onClick={() => void decide(proposal,"approve")}>Approve</button><button disabled={busy === `request_changes-${proposal.id}`} onClick={() => void decide(proposal,"request_changes")}>Request changes</button><button className="danger" disabled={busy === `reject-${proposal.id}`} onClick={() => void decide(proposal,"reject")}>Reject</button></div>}</article>; }) : <div className="empty">No proposals yet. Create the first business decision.</div>}</div></div>
          <div className="company-card"><div className="section-head"><div><span className="company-kicker">NEW DECISION</span><h2>Submit proposal</h2></div></div><label>Department<select value={proposalDepartment} onChange={(event) => setProposalDepartment(event.target.value as DepartmentKey)}>{Object.entries(departmentMeta).map(([key, meta]) => <option key={key} value={key}>{meta.short} · {meta.title}</option>)}</select></label><label>Title<input value={proposalTitle} onChange={(event) => setProposalTitle(event.target.value)} placeholder="e.g. Launch premium acquisition campaign" maxLength={160} /></label><label>Description<textarea value={proposalDescription} onChange={(event) => setProposalDescription(event.target.value)} placeholder="What are you proposing, and why?" maxLength={1000} /></label><label>Amount<input type="number" min="0" value={proposalAmount} onChange={(event) => setProposalAmount(event.target.value)} /></label><div className="rule-note"><strong>Approval routing</strong><span>Material spend routes through Finance; larger decisions escalate to the CEO. The server enforces this chain.</span></div><button className="company-primary full" disabled={busy === "proposal" || !proposalTitle.trim() || !isExecutive} onClick={() => void submitProposal()}>{busy === "proposal" ? "Submitting…" : isExecutive ? "Submit proposal →" : "Executive role required"}</button></div>
        </section>}

        {(message || error) && <div className={error ? "company-toast error" : "company-toast success"}>{error || message}</div>}
      </section>
    </div>
  </main>;
}
