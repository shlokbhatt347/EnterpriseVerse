"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getStoredUser } from "../lib/supabase-browser";
import { acceptEnterpriseInvitation, createEnterprise, listEnterpriseInvitations, searchPeople, sendEnterpriseInvitation } from "../competition/competition-browser";
import type { EnterpriseInvitation, Person, PlayerRole } from "../competition/competition-browser";
import "./enterprise.css";

type TeamSize = "solo" | "pair" | "trio" | "company";
type Enterprise = { id: string; name: string; industry: string | null; team_size: TeamSize };

const sizes: Array<{ id: TeamSize; title: string; capacity: string; description: string }> = [
  { id: "solo", title: "Solo", capacity: "1 founder", description: "Build independently. You can recruit later when your company is ready." },
  { id: "pair", title: "Pair", capacity: "2 founders", description: "You + 1 executive co-founder." },
  { id: "trio", title: "Trio", capacity: "3 founders", description: "You + up to 2 executive co-founders." },
  { id: "company", title: "Company", capacity: "Unlimited", description: "Assemble a larger founding team with no artificial participant cap." },
];

const roleOptions: Array<{ id: Exclude<PlayerRole, "ceo"> | "founder"; title: string; description: string }> = [
  { id: "cfo", title: "Finance Officer · CFO", description: "Cash, budgets, funding and financial analysis." },
  { id: "cmo", title: "Marketing Officer · CMO", description: "Customers, campaigns, pricing and growth." },
  { id: "coo", title: "Operations Officer · COO", description: "Production, inventory, capacity and supply chain." },
  { id: "cto", title: "Technology Officer · CTO", description: "Product, technology, R&D and innovation." },
  { id: "chro", title: "People Officer · CHRO", description: "Hiring, people, productivity and culture." },
];

const roleLabel = (value: string) => ({ cfo: "CFO · Finance Officer", cmo: "CMO · Marketing Officer", coo: "COO · Operations Officer", cto: "CTO · Technology Officer", chro: "CHRO · People Officer", founder: "Co-founder" } as Record<string, string>)[value] ?? value;

export default function EnterprisePage() {
  const user = getStoredUser();
  const userId = user?.id ?? null;
  const params = useSearchParams();
  const mode = params.get("mode") === "executive" ? "executive" : "founder";
  const [size, setSize] = useState<TeamSize>("pair");
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Person[]>([]);
  const [inviteRole, setInviteRole] = useState<Exclude<PlayerRole, "ceo"> | "founder">("cfo");
  const [invitations, setInvitations] = useState<EnterpriseInvitation[]>([]);
  const [busyKey, setBusyKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const limit = size === "solo" ? 1 : size === "pair" ? 2 : size === "trio" ? 3 : null;
  const remaining = limit === null ? null : Math.max(0, limit - 1 - selected.length);
  const sizeInfo = useMemo(() => sizes.find((item) => item.id === size)!, [size]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2 || !userId || mode !== "founder") { setResults([]); return; }
    const timer = window.setTimeout(() => { void searchPeople(query).then(setResults).catch(() => setResults([])); }, 250);
    return () => window.clearTimeout(timer);
  }, [query, userId, mode]);

  useEffect(() => {
    if (!userId) return;
    void listEnterpriseInvitations().then(setInvitations).catch(() => setInvitations([]));
  }, [userId]);

  async function run(key: string, action: () => Promise<void>, success?: string) {
    if (busyKey) return;
    setBusyKey(key); setError(""); setMessage("");
    try { await action(); if (success) setMessage(success); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Something went wrong."); }
    finally { setBusyKey(""); }
  }

  if (!user) return <main className="enterprise-shell"><section className="enterprise-card centered"><span className="enterprise-kicker">ENTERPRISEVERSE</span><h1>Build your career.</h1><p>Sign in to create a company, join an executive team and keep your enterprise identity connected.</p><Link className="enterprise-primary" href="/auth/signin">Sign in →</Link><Link className="enterprise-secondary" href="/start">Choose how to play</Link></section></main>;

  const create = () => run("create-enterprise", async () => {
    const id = await createEnterprise(name, industry, size);
    setEnterprise({ id, name: name.trim(), industry, team_size: size });
  }, "Enterprise created. You are now the CEO.");

  const invite = (person: Person) => run(`invite-${person.user_id}`, async () => {
    if (!enterprise) throw new Error("Create your enterprise first.");
    const invitationId = await sendEnterpriseInvitation(enterprise.id, person.user_id, inviteRole);
    setSelected((current) => current.filter((item) => item.user_id !== person.user_id));
    setQuery(""); setResults([]);
    setInvitations((current) => [{ id: invitationId, business_id: enterprise.id, inviter_id: user.id, invitee_id: person.user_id, requested_role: inviteRole, status: "pending", created_at: new Date().toISOString(), responded_at: null }, ...current]);
  }, `${person.display_name} has been invited as ${roleLabel(inviteRole)}.`);

  const choose = (person: Person) => {
    if (selected.some((item) => item.user_id === person.user_id)) return;
    if (remaining !== null && remaining <= 0) return;
    setSelected((current) => [...current, person]); setQuery(""); setResults([]);
  };

  const accept = (invitation: EnterpriseInvitation) => run(`accept-${invitation.id}`, async () => {
    await acceptEnterpriseInvitation(invitation.id);
    setInvitations((current) => current.map((entry) => entry.id === invitation.id ? { ...entry, status: "accepted", responded_at: new Date().toISOString() } : entry));
  }, `You joined the enterprise as ${roleLabel(invitation.requested_role)}.`);

  return <main className="enterprise-shell">
    <header className="enterprise-header"><div><Link className="enterprise-brand" href="/">ENTERPRISEVERSE</Link><span className="enterprise-kicker">{mode === "executive" ? "CAREER · JOIN A BUSINESS" : "FOUNDER · BUILD A BUSINESS"}</span><h1>{mode === "executive" ? "Find your place in a company." : "Build your company."}</h1><p>{mode === "executive" ? "Review invitations and enter a real enterprise as the executive role you chose." : "Start solo, assemble a founding team and grow into a living enterprise."}</p></div><Link className="enterprise-secondary" href="/start">Change path →</Link></header>

    {mode === "executive" ? <div className="enterprise-grid">
      <section className="enterprise-card setup-card"><div className="card-top"><div><span className="enterprise-kicker">01 · YOUR CAREER</span><h2>Executive path</h2></div><span className="capacity-badge">{user.displayName}</span></div><div className="created-state"><span>✓</span><div><strong>You chose an executive career.</strong><small>Company offers are delivered here and through the notification center in later phases.</small></div></div><div className="capacity-note"><strong>What happens next</strong><span>Accept an invitation from a CEO and your profile becomes an active company member with that assigned role.</span></div></section>
      <section className="enterprise-card inbox-card"><div className="card-top"><div><span className="enterprise-kicker">02 · OPPORTUNITIES</span><h2>Company invitations</h2></div><span>{invitations.filter((item) => item.invitee_id === user.id && item.status === "pending").length} pending</span></div>{invitations.filter((item) => item.invitee_id === user.id).length ? <div className="invitation-list">{invitations.filter((item) => item.invitee_id === user.id).map((item) => <div className="invitation-row" key={item.id}><div><strong>{roleLabel(item.requested_role)}</strong><small>{item.status} · {new Date(item.created_at).toLocaleDateString()}</small></div>{item.status === "pending" ? <button className="enterprise-primary" disabled={busyKey === `accept-${item.id}`} onClick={() => void accept(item)}>{busyKey === `accept-${item.id}` ? "Joining…" : "Accept role →"}</button> : <span className={`status ${item.status}`}>{item.status}</span>}</div>)}</div> : <div className="empty-state">No company invitations yet. Build your reputation and invitations will appear here.</div>}</section>
      <section className="enterprise-card inbox-card"><div className="card-top"><div><span className="enterprise-kicker">03 · YOUR STANDARD</span><h2>Executive roles</h2></div></div><div className="selected-list">{roleOptions.map((item) => <div className="selected-person" key={item.id}><span className="person-avatar">{item.id.slice(0,1).toUpperCase()}</span><div><strong>{item.title}</strong><small>{item.description}</small></div></div>)}</div></section>
    </div> : <div className="enterprise-grid">
      <section className="enterprise-card setup-card"><div className="card-top"><div><span className="enterprise-kicker">01 · STRUCTURE</span><h2>Choose your company size</h2></div><span className="capacity-badge">{sizeInfo.capacity}</span></div><div className="size-grid">{sizes.map((item) => <button type="button" key={item.id} className={`size-option ${size === item.id ? "selected" : ""}`} onClick={() => { setSize(item.id); if (item.id === "solo") setSelected([]); }}>{item.id === size ? "✓ " : ""}<strong>{item.title}</strong><b>{item.capacity}</b><small>{item.description}</small></button>)}</div><div className="field-grid"><label>Enterprise name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} placeholder="e.g. Nova Labs" /></label><label>Industry<input value={industry} onChange={(event) => setIndustry(event.target.value)} maxLength={80} placeholder="Technology" /></label></div>{!enterprise ? <button className="enterprise-primary full" disabled={busyKey === "create-enterprise" || !name.trim()} onClick={() => void create()}>{busyKey === "create-enterprise" ? "Creating enterprise…" : "Create enterprise →"}</button> : <div className="created-state"><span>✓</span><div><strong>{enterprise.name}</strong><small>CEO · {sizeInfo.title} · {sizeInfo.capacity}</small></div><span className="created-badge">LIVE</span></div>}</section>
      <section className="enterprise-card invite-card"><div className="card-top"><div><span className="enterprise-kicker">02 · FOUNDING TEAM</span><h2>Recruit your executives</h2></div><span className="remaining">{size === "solo" ? "No slots" : remaining === null ? "Unlimited" : `${remaining} slot${remaining === 1 ? "" : "s"} left`}</span></div>{size === "solo" ? <div className="locked-state"><div>◈</div><strong>Solo means solo for now.</strong><p>You can evolve this company into a larger team later.</p></div> : !enterprise ? <div className="locked-state"><div>01</div><strong>Create your enterprise first.</strong><p>Your participant limit and membership authority are enforced by Supabase.</p></div> : <><div className="field"><label>Role to recruit<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as typeof inviteRole)}>{roleOptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></div><div className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by display name or exact email" disabled={remaining !== null && remaining <= 0} /><small>Choose a real role before sending the invitation.</small></div>{results.length > 0 && <div className="search-results">{results.map((person) => <button type="button" key={person.user_id} onClick={() => choose(person)}><span className="person-avatar">{person.display_name.slice(0,1).toUpperCase()}</span><span><strong>{person.display_name}</strong><small>{person.email ?? "EnterpriseVerse player"}</small></span><b>Select</b></button>)}</div>}{selected.length > 0 && <div className="selected-list">{selected.map((person) => <div key={person.user_id} className="selected-person"><span className="person-avatar">{person.display_name.slice(0,1).toUpperCase()}</span><div><strong>{person.display_name}</strong><small>{roleLabel(inviteRole)}</small></div><button type="button" onClick={() => setSelected((current) => current.filter((item) => item.user_id !== person.user_id))} aria-label={`Remove ${person.display_name}`}>×</button><button type="button" className="enterprise-primary" disabled={busyKey === `invite-${person.user_id}`} onClick={() => void invite(person)}>{busyKey === `invite-${person.user_id}` ? "Sending…" : "Invite →"}</button></div>)}</div>}<div className="capacity-note"><strong>{sizeInfo.title} capacity</strong><span>{size === "company" ? "Unlimited participants." : `${remaining} invitation slot${remaining === 1 ? "" : "s"} remaining after your CEO seat.`}</span></div></>}</section>
      <section className="enterprise-card inbox-card"><div className="card-top"><div><span className="enterprise-kicker">03 · COMPANY STATE</span><h2>Your invitations</h2></div><span>{invitations.filter((item) => item.inviter_id === user.id && item.status === "pending").length} pending</span></div>{invitations.filter((item) => item.inviter_id === user.id).length ? <div className="invitation-list">{invitations.filter((item) => item.inviter_id === user.id).map((item) => <div className="invitation-row" key={item.id}><div><strong>{roleLabel(item.requested_role)}</strong><small>{item.status} · {new Date(item.created_at).toLocaleDateString()}</small></div><span className={`status ${item.status}`}>{item.status}</span></div>)}</div> : <div className="empty-state">Your company invitations will appear here.</div>}</section>
    </div>}
    {(message || error) && <div className={error ? "enterprise-toast error" : "enterprise-toast success"} role={error ? "alert" : "status"}>{error || message}</div>}
  </main>;
}
