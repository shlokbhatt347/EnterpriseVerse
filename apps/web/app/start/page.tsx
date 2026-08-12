"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPlayerBootstrap, setPlayerOnboarding } from "../competition/competition-browser";
import type { OnboardingPath, PlayerBootstrap, PlayerRole } from "../competition/competition-browser";
import { getStoredUser } from "../lib/supabase-browser";
import "./start.css";

const roles: Array<{ id: PlayerRole; title: string; short: string; description: string }> = [
  { id: "cfo", title: "Finance Officer", short: "CFO", description: "Own cash, budgets, funding and financial decisions." },
  { id: "cmo", title: "Marketing Officer", short: "CMO", description: "Own customers, campaigns, pricing and growth." },
  { id: "coo", title: "Operations Officer", short: "COO", description: "Own production, inventory, capacity and supply chain." },
  { id: "cto", title: "Technology Officer", short: "CTO", description: "Own product, technology, R&D and innovation." },
  { id: "chro", title: "People Officer", short: "CHRO", description: "Own hiring, people, productivity and culture." },
];

export default function StartPage() {
  const router = useRouter();
  const user = getStoredUser();
  const userId = user?.id ?? null;
  const [path, setPath] = useState<OnboardingPath | null>(null);
  const [role, setRole] = useState<PlayerRole | null>(null);
  const [bootstrap, setBootstrap] = useState<PlayerBootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let active = true;
    void getPlayerBootstrap().then((value) => {
      if (!active) return;
      setBootstrap(value);
      const profile = value?.profile;
      if (profile?.onboarding_completed && profile.current_business_id) {
        router.replace("/company");
        return;
      }
      if (profile?.onboarding_path) setPath(profile.onboarding_path);
      if (profile?.preferred_role) setRole(profile.preferred_role);
    }).catch(() => undefined).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router, userId]);

  const selectedRole = useMemo(() => roles.find((item) => item.id === role), [role]);

  async function choose(nextPath: OnboardingPath) {
    setPath(nextPath);
    setError("");
    setBusy(true);
    try {
      await setPlayerOnboarding(nextPath, nextPath === "founder" ? "ceo" : null);
      if (nextPath === "founder") router.push("/enterprise?mode=founder");
      else if (nextPath === "explore") router.push("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save your choice.");
    } finally {
      setBusy(false);
    }
  }

  async function chooseExecutiveRole(nextRole: PlayerRole) {
    setRole(nextRole);
    setError("");
    setBusy(true);
    try {
      await setPlayerOnboarding("executive", nextRole);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save your role.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <main className="start-shell"><section className="start-card start-auth"><span className="start-kicker">ENTERPRISEVERSE</span><h1>Choose how you want to play.</h1><p>Sign in to build your career, create a company or join another founder's enterprise.</p><Link className="start-primary" href="/auth/signin">Sign in →</Link><Link className="start-secondary" href="/">Back to simulation</Link></section></main>;
  if (loading) return <main className="start-shell"><section className="start-card start-loading"><span className="start-pulse" />Loading your EnterpriseVerse profile…</section></main>;

  return <main className="start-shell">
    <header className="start-header"><Link href="/" className="start-brand">ENTERPRISEVERSE</Link><span className="start-user">{user.displayName}</span></header>
    <section className="start-intro"><span className="start-kicker">PHASE 1 · PLAYER FOUNDATION</span><h1>How do you want to play?</h1><p>You can build your own company, join another business as an executive, or explore the simulation first.</p></section>

    <div className="start-grid">
      <button type="button" className={`start-path ${path === "founder" ? "selected" : ""}`} disabled={busy} onClick={() => void choose("founder")}>
        <span className="start-icon">♛</span><span className="start-path-kicker">BUILD & LEAD</span><strong>Become a Founder / CEO</strong><p>Create your own enterprise, start solo or with co-founders, and make the final strategic decisions.</p><span className="start-path-meta">Own the company · Recruit the team · Lead the business</span>
      </button>
      <button type="button" className={`start-path ${path === "executive" ? "selected" : ""}`} disabled={busy} onClick={() => setPath("executive")}>
        <span className="start-icon">◫</span><span className="start-path-kicker">JOIN A BUSINESS</span><strong>Become an Executive</strong><p>Choose a professional role and build your career inside another player's enterprise.</p><span className="start-path-meta">Finance · Marketing · Operations · Technology · People</span>
      </button>
      <button type="button" className={`start-path ${path === "explore" ? "selected" : ""}`} disabled={busy} onClick={() => void choose("explore")}>
        <span className="start-icon">✦</span><span className="start-path-kicker">EXPLORE & LEARN</span><strong>Explore before committing</strong><p>Jump into the existing enterprise simulator and learn by running a business without choosing a permanent company role yet.</p><span className="start-path-meta">Guided entry · No commitment · Try the world</span>
      </button>
    </div>

    {path === "executive" && <section className="role-panel" aria-label="Choose your executive role">
      <div><span className="start-kicker">YOUR FIRST ROLE</span><h2>What do you want to become?</h2><p>Choose the responsibility you want to build your career around. You can change roles later when the company structure allows it.</p></div>
      <div className="role-grid">{roles.map((item) => <button type="button" key={item.id} className={`role-card ${role === item.id ? "selected" : ""}`} disabled={busy} onClick={() => void chooseExecutiveRole(item.id)}><span className="role-code">{item.short}</span><strong>{item.title}</strong><span>{item.description}</span></button>)}</div>
      <div className="role-next">{selectedRole ? <><div><span className="start-kicker">SELECTED</span><strong>{selectedRole.title}</strong><span>{bootstrap?.current_business ? "You already have a company context." : "Next, accept a company invitation to join your first enterprise."}</span></div><button type="button" className="start-primary" disabled={busy} onClick={() => router.push("/enterprise?mode=executive")}>Find a business →</button></> : <span>Select a role to continue.</span>}</div>
    </section>}

    {error && <p className="start-error" role="alert">{error}</p>}
    <footer className="start-footer"><span>Your player identity stays with you as your company and career evolve.</span><Link href="/company">Open company workspace →</Link></footer>
  </main>;
}
