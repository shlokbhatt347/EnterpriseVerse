"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { calculatePhase7Score, getPhase7Achievements, getPhase7CompanySnapshot } from "@enterpriseverse/simulation";
import { loadActiveSeason, loadGlobalRankings } from "./endgame-browser";
import "./endgame.css";

type SimulationState = Parameters<typeof getPhase7CompanySnapshot>[0];
const SAVE_KEY = "enterpriseverse:active-business:v1";
const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

export default function EndgamePage() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [season, setSeason] = useState<Awaited<ReturnType<typeof loadActiveSeason>>>(null);
  const [rankings, setRankings] = useState<Awaited<ReturnType<typeof loadGlobalRankings>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (raw) setState(JSON.parse(raw) as SimulationState);
    } catch { /* fall back to overview state */ }
    void Promise.all([loadActiveSeason(), loadGlobalRankings()]).then(([nextSeason, nextRankings]) => {
      setSeason(nextSeason);
      setRankings(nextRankings);
    }).finally(() => setLoading(false));
  }, []);

  const snapshot = state ? getPhase7CompanySnapshot(state) : null;
  const score = state && snapshot ? calculatePhase7Score(snapshot, state) : null;
  const achievements = state && snapshot && score ? getPhase7Achievements(snapshot, score, state) : [];
  const topRankings = rankings.slice(0, 8);

  return <main className="endgame-shell">
    <header className="endgame-header">
      <div>
        <Link href="/" className="endgame-brand">ENTERPRISEVERSE</Link>
        <span className="endgame-kicker">GLOBAL ENDGAME</span>
        <h1>Build a legacy worth competing for.</h1>
        <p>Track your enterprise score, achievements, season, history and global competition from one executive command center.</p>
      </div>
      <div className="endgame-actions"><Link href="/world" className="secondary-button">Executive world</Link><Link href="/competition" className="primary-button">Compete →</Link></div>
    </header>

    <section className="season-banner">
      <div><span className="label">ACTIVE SEASON</span><h2>{season?.name ?? "Season 1 — Enterprise Ascension"}</h2><p>{season?.theme ?? "Build the strongest enterprise, career and competitive legacy."}</p></div>
      <div className="season-meta"><span className="season-live"><i /> LIVE</span><span>{season ? new Date(season.starts_at).toLocaleDateString("en-IN") : "Current season"}</span></div>
    </section>

    {!state || !snapshot || !score ? <section className="empty-legacy panel"><div className="empty-icon">◆</div><h2>Your enterprise legacy starts here.</h2><p>Create or resume a company to unlock your score, achievements and endgame analytics.</p><div className="empty-actions"><Link href="/play" className="primary-button">Build your business →</Link><Link href="/enterprise" className="secondary-button">Company setup</Link></div></section> : <>
      <section className="hero-grid">
        <article className="score-hero panel"><div className="label">ENTERPRISE SCORE</div><div className="score-value">{score.overall}<span>/100</span></div><div className="score-ring" style={{ "--score": `${score.overall * 3.6}deg` } as React.CSSProperties}><div><b>{score.overall}</b><small>LEGACY</small></div></div><h2>{snapshot.companyName}</h2><p>Day {snapshot.day} · {snapshot.outcome === "continue" ? "Operating" : snapshot.outcome.toUpperCase()}</p></article>
        <article className="panel metric-panel"><div className="panel-heading"><div><span className="label">COMPANY LEGACY</span><h2>What your company has built</h2></div><Link href="/company" className="text-link">Open company →</Link></div><div className="metric-grid"><div><span>Valuation</span><b>{money(snapshot.valuation)}</b></div><div><span>Revenue</span><b>{money(snapshot.revenue)}</b></div><div><span>Profit</span><b>{money(snapshot.profit)}</b></div><div><span>Cash</span><b>{money(snapshot.cash)}</b></div><div><span>Market share</span><b>{snapshot.marketShare.toFixed(1)}%</b></div><div><span>Reputation</span><b>{Math.round(snapshot.reputation)}/100</b></div></div></article>
      </section>

      <section className="content-grid">
        <article className="panel"><div className="panel-heading"><div><span className="label">LEGACY SCORECARD</span><h2>Where the enterprise wins</h2></div></div><div className="score-list">{[["Growth", score.growth], ["Profitability", score.profitability], ["Market power", score.market], ["Resilience", score.resilience], ["Reputation", score.reputation], ["Innovation", score.innovation], ["Sustainability", score.sustainability]].map(([label, value]) => <div className="score-row" key={String(label)}><div><span>{label}</span><b>{Math.round(Number(value))}</b></div><div className="bar"><i style={{ width: `${Number(value)}%` }} /></div></div>)}</div></article>
        <article className="panel"><div className="panel-heading"><div><span className="label">ACHIEVEMENTS</span><h2>Your milestones</h2></div><span className="count-pill">{achievements.length}</span></div>{achievements.length ? <div className="achievement-grid">{achievements.map((achievement) => <div className={`achievement ${achievement.tier}`} key={achievement.id}><div className="achievement-mark">✦</div><div><strong>{achievement.title}</strong><p>{achievement.description}</p><small>{achievement.tier.toUpperCase()}</small></div></div>)}</div> : <div className="muted-state">Keep operating and making strong decisions. Your first milestone is waiting.</div>}</article>
      </section>
    </>}

    <section className="content-grid lower">
      <article className="panel"><div className="panel-heading"><div><span className="label">GLOBAL COMPETITION</span><h2>Who is leading EnterpriseVerse?</h2></div><Link href="/competition" className="text-link">Enter competition →</Link></div>{loading ? <div className="loading-state">Loading global rankings…</div> : topRankings.length ? <div className="ranking-table">{topRankings.map((row, index) => <div className="rank-row" key={`${row.user_id}-${index}`}><span className="rank-number">#{index + 1}</span><span className="rank-name">{row.display_name ?? "Founder"}</span><span className="rank-score">{Math.round(Number(row.score)).toLocaleString("en-IN")}</span></div>)}</div> : <div className="muted-state">Global rankings will appear after the first completed competitions.</div>}</article>
      <article className="panel"><div className="panel-heading"><div><span className="label">ENDGAME PATH</span><h2>Choose what your legacy becomes</h2></div></div><div className="end-path"><div><b>Continue operating</b><span>Keep compounding your enterprise.</span></div><div><b>IPO</b><span>Turn your enterprise into a public-company endgame when eligible.</span></div><div><b>Acquisition / Merger</b><span>Use Phase 5 corporate strategy to create a strategic exit.</span></div><div><b>Hall of Fame</b><span>Exceptional enterprises and executives become permanent milestones.</span></div></div></article>
    </section>

    <footer className="endgame-footer"><span>EnterpriseVerse · Phase 7</span><div><Link href="/career">Career</Link><Link href="/strategy">Strategy</Link><Link href="/learning">Learning</Link></div></footer>
  </main>;
}
