"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getStoredUser } from "../lib/supabase-browser";
import { acceptEnterpriseInvitation, createEnterprise, listEnterpriseInvitations, searchPeople, sendEnterpriseInvitation } from "../competition/competition-browser";
import type { Person } from "../competition/competition-browser";
import "./enterprise.css";

type TeamSize = "solo" | "pair" | "trio" | "company";
type Enterprise = { id: string; name: string; industry: string | null; team_size: TeamSize };
type Invitation = { id: string; business_id: string; inviter_id: string; invitee_id: string; status: string; created_at: string };

const sizes: Array<{ id: TeamSize; title: string; capacity: string; description: string }> = [
  { id: "solo", title: "Solo", capacity: "1 founder", description: "Build independently. No additional participants." },
  { id: "pair", title: "Pair", capacity: "2 founders", description: "You + 1 co-founder." },
  { id: "trio", title: "Trio", capacity: "3 founders", description: "You + up to 2 co-founders." },
  { id: "company", title: "Company", capacity: "Unlimited", description: "Build a larger founding team with no artificial participant cap." },
];

export default function EnterprisePage() {
  const user = getStoredUser();
  const [size, setSize] = useState<TeamSize>("pair");
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Person[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const limit = size === "solo" ? 1 : size === "pair" ? 2 : size === "trio" ? 3 : null;
  const remaining = limit === null ? null : Math.max(0, limit - 1 - selected.length);
  const sizeInfo = useMemo(() => sizes.find((item) => item.id === size)!, [size]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2 || !user) { setResults([]); return; }
    const timer = window.setTimeout(() => { void searchPeople(query).then(setResults).catch(() => setResults([])); }, 180);
    return () => window.clearTimeout(timer);
  }, [query, user]);

  useEffect(() => {
    if (!user) return;
    void listEnterpriseInvitations().then(setInvitations).catch(() => setInvitations([]));
  }, [user]);

  async function run(action: () => Promise<void>, success?: string) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); if (success) setMessage(success); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  if (!user) return <main className="enterprise-shell"><section className="enterprise-card centered"><span className="enterprise-kicker">ENTERPRISE BUILDER</span><h1>Build together.</h1><p>Sign in to create an enterprise, search for friends and send secure co-founder invitations.</p><Link className="enterprise-primary" href="/auth/signin">Sign in →</Link><Link className="enterprise-secondary" href="/">Back to simulator</Link></section></main>;

  const create = () => run(async () => {
    const id = await createEnterprise(name, industry, size);
    setEnterprise({ id, name: name.trim(), industry, team_size: size });
  }, "Enterprise created. You can now invite your co-founders.");

  const invite = (person: Person) => run(async () => {
    const invitationId = await sendEnterpriseInvitation(enterprise!.id, person.user_id);
    setSelected((current) => current.filter((item) => item.user_id !== person.user_id));
    setQuery("");
    setResults([]);
    setInvitations((current) => [{ id: invitationId, business_id: enterprise!.id, inviter_id: user.id, invitee_id: person.user_id, status: "pending", created_at: new Date().toISOString() }, ...current]);
  }, `Invitation sent to ${person.display_name}.`);

  const choose = (person: Person) => {
    if (selected.some((item) => item.user_id === person.user_id)) return;
    if (remaining !== null && remaining <= 0) return;
    setSelected((current) => [...current, person]);
    setQuery("");
    setResults([]);
  };

  return <main className="enterprise-shell">
    <header className="enterprise-header"><div><Link className="enterprise-brand" href="/">ENTERPRISEVERSE</Link><span className="enterprise-kicker">COLLABORATION</span><h1>Build your company together.</h1><p>Invite the right founders without losing control of who can join.</p></div><Link className="enterprise-secondary" href="/competition">Competition →</Link></header>

    <div className="enterprise-grid">
      <section className="enterprise-card setup-card">
        <div className="card-top"><div><span className="enterprise-kicker">01 · STRUCTURE</span><h2>Choose your company size</h2></div><span className="capacity-badge">{sizeInfo.capacity}</span></div>
        <div className="size-grid">{sizes.map((item) => <button type="button" key={item.id} className={`size-option ${size === item.id ? "selected" : ""}`} onClick={() => { setSize(item.id); if (item.id === "solo") setSelected([]); }}><span className="size-check">{size === item.id ? "✓" : ""}</span><strong>{item.title}</strong><b>{item.capacity}</b><small>{item.description}</small></button>)}</div>
        <div className="field-grid"><label>Enterprise name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} placeholder="e.g. Nova Labs" /></label><label>Industry<input value={industry} onChange={(event) => setIndustry(event.target.value)} maxLength={80} placeholder="Technology" /></label></div>
        {!enterprise ? <button className="enterprise-primary full" disabled={busy || !name.trim()} onClick={create}>Create enterprise →</button> : <div className="created-state"><span>✓</span><div><strong>{enterprise.name}</strong><small>{sizeInfo.title} · {sizeInfo.capacity}</small></div><span className="created-badge">LIVE</span></div>}
      </section>

      <section className="enterprise-card invite-card">
        <div className="card-top"><div><span className="enterprise-kicker">02 · FOUNDING TEAM</span><h2>Invite co-founders</h2></div><span className="remaining">{size === "solo" ? "No slots" : remaining === null ? "Unlimited" : `${remaining} slot${remaining === 1 ? "" : "s"} left`}</span></div>
        {size === "solo" ? <div className="locked-state"><div>◈</div><strong>Solo means solo.</strong><p>No additional participants are allowed for this enterprise.</p></div> : !enterprise ? <div className="locked-state"><div>01</div><strong>Create your enterprise first.</strong><p>Your participant limit is enforced by the database after creation.</p></div> : <>
          <div className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by display name or exact email" disabled={remaining !== null && remaining <= 0} /><small>Results never expose private email addresses unless the email is an exact match.</small></div>
          {results.length > 0 && <div className="search-results">{results.map((person) => <button type="button" key={person.user_id} onClick={() => choose(person)}><span className="person-avatar">{person.display_name.slice(0, 1).toUpperCase()}</span><span><strong>{person.display_name}</strong><small>{person.email ?? "EnterpriseVerse founder"}</small></span><b>Invite</b></button>)}</div>}
          {selected.length > 0 && <div className="selected-list">{selected.map((person) => <div key={person.user_id} className="selected-person"><span className="person-avatar">{person.display_name.slice(0, 1).toUpperCase()}</span><div><strong>{person.display_name}</strong><small>Ready to invite</small></div><button type="button" onClick={() => setSelected((current) => current.filter((item) => item.user_id !== person.user_id))} aria-label={`Remove ${person.display_name}`}>×</button></div>)}</div>}
          {selected.map((person) => <button key={`send-${person.user_id}`} className="enterprise-primary full" disabled={busy} onClick={() => invite(person)}>Send invitation to {person.display_name} →</button>)}
          <div className="capacity-note"><strong>{sizeInfo.title} capacity</strong><span>{size === "company" ? "Unlimited participants. The database imposes no artificial cap." : `${remaining} invitation slot${remaining === 1 ? "" : "s"} remaining after your founder account.`}</span></div>
        </>}
      </section>

      <section className="enterprise-card inbox-card"><div className="card-top"><div><span className="enterprise-kicker">03 · INBOX</span><h2>Your invitations</h2></div><span>{invitations.filter((item) => item.invitee_id === user.id && item.status === "pending").length} pending</span></div>{invitations.length ? <div className="invitation-list">{invitations.map((item) => <div className="invitation-row" key={item.id}><div><strong>{item.status === "pending" && item.invitee_id === user.id ? "Enterprise invitation" : "Invitation"}</strong><small>{item.status} · {new Date(item.created_at).toLocaleDateString()}</small></div>{item.invitee_id === user.id && item.status === "pending" ? <button className="enterprise-secondary" disabled={busy} onClick={() => run(async () => { await acceptEnterpriseInvitation(item.id); setInvitations((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "accepted" } : entry)); }, "Invitation accepted. You are now a founder.")}>Accept</button> : <span className={`status ${item.status}`}>{item.status}</span>}</div>)}</div> : <div className="empty-state">No invitations yet.</div>}</section>
    </div>
    {(message || error) && <div className={error ? "enterprise-toast error" : "enterprise-toast success"} role={error ? "alert" : "status"}>{error || message}</div>}
  </main>;
}
