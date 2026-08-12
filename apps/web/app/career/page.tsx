"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getStoredUser } from "../lib/supabase-browser";
import { loadCareerProfile, loadNotificationCenter, listOpenPositions, respondRecruitmentOffer, searchRecruitablePlayers, createRecruitmentOffer } from "./career-browser";
import type { Candidate, CareerProfile, OpenPosition } from "./career-browser";
import { subscribeToFriendInbox } from "../competition/realtime";
import "./career.css";

const roleMeta: Record<string, { code: string; title: string }> = { ceo: { code: "CEO", title: "Chief Executive Officer" }, cfo: { code: "CFO", title: "Finance Officer" }, cmo: { code: "CMO", title: "Marketing Officer" }, coo: { code: "COO", title: "Operations Officer" }, cto: { code: "CTO", title: "Technology Officer" }, chro: { code: "CHRO", title: "People Officer" } };
const money = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

export default function CareerPage() {
  const user = getStoredUser();
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; title: string; body: string; read_at: string | null; created_at: string }>>([]);
  const [tab, setTab] = useState("overview");
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [positionId, setPositionId] = useState("");
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    if (!user) return;
    try { const [career, center] = await Promise.all([loadCareerProfile(), loadNotificationCenter()]); setProfile(career); setNotifications(center.notifications); if (career?.profile.current_business_id) setPositions(await listOpenPositions(career.profile.current_business_id)); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load your career profile."); }
  }
  useEffect(() => { if (!user) return; void refresh(); return subscribeToFriendInbox(user.id, () => void refresh()); }, [user?.id]);

  const activeRole = profile?.profile.active_role ?? "";
  const canRecruit = activeRole === "ceo" || activeRole === "chro";
  const selectedPosition = positions.find((p) => p.id === positionId) ?? positions[0] ?? null;
  const unread = notifications.filter((item) => !item.read_at).length;
  const skills = Object.entries(profile?.progress.skills ?? {}).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 6);

  async function findCandidates(nextQuery = query) {
    if (!profile?.profile.current_business_id || !selectedPosition) return;
    setBusy("search"); setError("");
    try { setCandidates(await searchRecruitablePlayers(profile.profile.current_business_id, selectedPosition.role, nextQuery)); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to search candidates."); } finally { setBusy(""); }
  }
  async function offer(candidate: Candidate) {
    if (!profile?.profile.current_business_id || !selectedPosition) return;
    setBusy(`offer-${candidate.user_id}`); setError("");
    try { await createRecruitmentOffer({ businessId: profile.profile.current_business_id, candidateId: candidate.user_id, positionId: selectedPosition.id, compensation: selectedPosition.compensation, reason: `Role fit ${Math.round(candidate.role_fit)}%, reputation ${Math.round(candidate.reputation)}.` }); setMessage(`Offer sent to ${candidate.display_name}.`); setCandidates((current) => current.filter((item) => item.user_id !== candidate.user_id)); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to send offer."); } finally { setBusy(""); }
  }
  async function respond(offerId: string, action: "accept" | "decline") {
    setBusy(`${action}-${offerId}`); setError("");
    try { await respondRecruitmentOffer(offerId, action); setMessage(action === "accept" ? "You moved into the new company." : "Offer declined. You remain with your current company."); await refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to respond to offer."); } finally { setBusy(""); }
  }

  if (!user) return <main className="career-shell"><section className="career-card centered"><span className="career-kicker">CAREER</span><h1>Build your professional identity.</h1><p>Sign in to view your role, reputation, company history and recruitment opportunities.</p><Link href="/auth/signin" className="career-primary">Sign in →</Link></section></main>;
  if (!profile) return <main className="career-shell"><section className="career-loading">Loading your career profile…</section></main>;

  return <main className="career-shell">
    <header className="career-top"><div><Link href="/" className="career-brand">ENTERPRISEVERSE</Link><span className="career-kicker">PLAYER CAREER</span><h1>{profile.profile.display_name}</h1><p>{activeRole ? `${roleMeta[activeRole]?.code ?? activeRole.toUpperCase()} · ${roleMeta[activeRole]?.title ?? "Executive"}` : "Building your enterprise career"}</p></div><div className="career-top-actions"><Link href="/company">Company →</Link><button className="career-alert" onClick={() => setTab("notifications")}>🔔 {unread || ""}</button></div></header>
    <nav className="career-tabs">{["overview","history","offers","recruit","notifications"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</nav>

    {tab === "overview" && <div className="career-grid">
      <section className="career-card career-hero"><div><span className="career-kicker">EXECUTIVE LEVEL</span><strong className="career-level">{profile.progress.level}</strong><p>{profile.progress.xp.toLocaleString()} XP · Reputation {Math.round(profile.progress.reputation)}/100</p></div><div className="career-value"><span>Market value</span><strong>{money(profile.progress.market_value)}</strong><small>Your value is shaped by role fit, experience and performance.</small></div></section>
      <section className="career-card"><div className="section-head"><div><span className="career-kicker">SKILLS</span><h2>Your professional edge</h2></div></div><div className="skill-list">{skills.length ? skills.map(([key,value]) => <div className="skill-row" key={key}><span>{key.toUpperCase()}</span><div><i style={{ width: `${Math.max(4,Math.min(100,Number(value)))}%` }} /></div><strong>{Math.round(Number(value))}</strong></div>) : <div className="career-empty">Skills will develop through real company decisions.</div>}</div></section>
      <section className="career-card"><div className="section-head"><div><span className="career-kicker">CURRENT COMPANY</span><h2>{profile.profile.current_business_id ? "Your active enterprise" : "Independent"}</h2></div><Link href="/company">Open company →</Link></div>{profile.profile.current_business_id ? <div className="company-chip"><strong>Active role</strong><span>{activeRole ? roleMeta[activeRole]?.code : "Executive"}</span><small>Your active company and role determine your career context.</small></div> : <div className="career-empty">You are currently unattached. Explore opportunities or build your own company.</div>}</section>
      <section className="career-card"><div className="section-head"><div><span className="career-kicker">RECRUITMENT</span><h2>Career opportunities</h2></div><button onClick={() => setTab("offers")}>View offers →</button></div>{profile.offers.filter((offer) => offer.status === "pending").length ? profile.offers.filter((offer) => offer.status === "pending").slice(0,3).map((offer) => <div className="offer-mini" key={offer.id}><div><strong>{offer.company.name}</strong><span>{roleMeta[offer.role]?.code ?? offer.role.toUpperCase()} · Level {offer.company.company_level}</span></div><button onClick={() => setTab("offers")}>Review</button></div>) : <div className="career-empty">No active recruitment offers. Keep building your reputation.</div>}</section>
    </div>}

    {tab === "history" && <section className="career-card"><div className="section-head"><div><span className="career-kicker">CAREER TIMELINE</span><h2>Your professional history</h2></div></div>{profile.history.length ? <div className="career-timeline">{profile.history.map((item) => <div className="history-item" key={item.id}><span className="history-dot" /><div><strong>{item.company_name}</strong><span>{roleMeta[item.role]?.code ?? item.role.toUpperCase()} · {new Date(item.started_at).toLocaleDateString()}</span><small>{item.ended_at ? `Left ${new Date(item.ended_at).toLocaleDateString()}` : "Current role"}</small><p>{item.summary}</p></div></div>)}</div> : <div className="career-empty">Your first company chapter will appear here.</div>}</section>}

    {tab === "offers" && <section className="career-card"><div className="section-head"><div><span className="career-kicker">RECRUITMENT OFFERS</span><h2>Companies interested in you</h2></div></div>{profile.offers.length ? profile.offers.map((offer) => <article className={`offer-card ${offer.status}`} key={offer.id}><div><span className="offer-code">{roleMeta[offer.role]?.code ?? offer.role.toUpperCase()}</span><h3>{offer.company.name}</h3><p>Level {offer.company.company_level} · {offer.company.stage} · {offer.company.industry ?? "Enterprise"}</p><small>{offer.reason || "Your profile matches an open executive position."}</small></div><div className="offer-side"><strong>{money(offer.compensation)}</strong>{offer.status === "pending" ? <div><button disabled={busy === `accept-${offer.id}`} onClick={() => void respond(offer.id,"accept")}>{busy === `accept-${offer.id}` ? "Moving…" : "Accept"}</button><button disabled={busy === `decline-${offer.id}`} className="secondary" onClick={() => void respond(offer.id,"decline")}>{busy === `decline-${offer.id}` ? "…" : "Stay"}</button></div> : <span>{offer.status}</span>}</div></article>) : <div className="career-empty">No offers yet.</div>}</section>}

    {tab === "recruit" && <section className="career-grid recruiter-layout">{canRecruit && profile.profile.current_business_id ? <><div className="career-card"><div className="section-head"><div><span className="career-kicker">TALENT SEARCH</span><h2>Recruit an executive</h2><p>Only roles your company can legitimately recruit are shown.</p></div></div><label>Open position<select value={positionId || selectedPosition?.id || ""} onChange={(event) => { setPositionId(event.target.value); setCandidates([]); }}>{positions.map((position) => <option key={position.id} value={position.id}>{position.title}</option>)}</select></label><div className="search-line"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search player profile" /><button disabled={busy === "search" || !selectedPosition} onClick={() => void findCandidates()}>{busy === "search" ? "Searching…" : "Search"}</button></div><small className="criteria">Recruitment requires role fit ≥ {selectedPosition?.minimum_skill ?? 0}, reputation ≥ {selectedPosition?.minimum_reputation ?? 0}, experience ≥ {selectedPosition?.minimum_experience ?? 0}, and a recruiting company at least two levels above the candidate's current company.</small></div><div className="career-card"><div className="section-head"><div><span className="career-kicker">CANDIDATES</span><h2>{candidates.length} matched profiles</h2></div></div>{candidates.length ? <div className="candidate-list">{candidates.map((candidate) => <div className="candidate" key={candidate.user_id}><div><strong>{candidate.display_name}</strong><span>{candidate.current_company_name ?? "Independent"} · Level {candidate.career_level}</span><small>Role fit {Math.round(candidate.role_fit)} · Reputation {Math.round(candidate.reputation)} · {candidate.experience_points.toLocaleString()} XP</small></div><button disabled={busy === `offer-${candidate.user_id}`} onClick={() => void offer(candidate)}>{busy === `offer-${candidate.user_id}` ? "Sending…" : "Recruit →"}</button></div>) : <div className="career-empty">Search for eligible players. Candidates from companies too close to your level are automatically excluded.</div>}</div></> : <div className="career-card centered"><span className="career-kicker">RECRUITMENT</span><h2>Recruiting isn't assigned to your role.</h2><p>Only the CEO or People Officer can make company recruitment offers in Phase 3.</p><Link href="/company" className="career-primary">Open company →</Link></div>}</section>}

    {tab === "notifications" && <section className="career-card"><div className="section-head"><div><span className="career-kicker">NOTIFICATION DASHBOARD</span><h2>Everything happening around you</h2></div></div>{notifications.length ? <div className="career-notifications">{notifications.map((item) => <div className={`career-notification ${item.read_at ? "read" : "unread"}`} key={item.id}><strong>{item.title}</strong><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString()}</small></div>)}</div> : <div className="career-empty">You're all caught up.</div>}</section>}

    {(message || error) && <div className={error ? "career-toast error" : "career-toast success"}>{error || message}</div>}
  </main>;
}
