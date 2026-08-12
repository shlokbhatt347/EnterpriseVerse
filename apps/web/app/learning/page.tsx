"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPhase23Debrief, createSkillProfile23, evaluatePhase23Decision, generatePhase23Challenge, getPhase23Scenarios, phase23Signature, recordPhase23Learning, type LearningRecord23 } from "@enterpriseverse/simulation";
import { useAccount } from "../auth-provider";
import "./learning.css";

const SAVE_KEY = "enterpriseverse:phase23-learning:v1";

export default function LearningHubPage() {
  const { authReady, loadBusiness, saveBusiness } = useAccount();
  const [history, setHistory] = useState<LearningRecord23[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authReady) return;
    void loadBusiness<LearningRecord23[]>(SAVE_KEY)
      .then((saved: LearningRecord23[] | null) => {
        if (Array.isArray(saved)) setHistory(saved);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [authReady, loadBusiness]);

  const profile = useMemo(() => createSkillProfile23(history), [history]);
  const challenge = useMemo(() => generatePhase23Challenge(history.length + 23, profile, history), [history, profile]);
  const scenario = getPhase23Scenarios().find((item) => item.id === (selectedId || challenge.scenario.id)) ?? challenge.scenario;
  const debrief = useMemo(() => createPhase23Debrief(history, profile), [history, profile]);

  async function choose(choiceId: string) {
    const evaluation = evaluatePhase23Decision(scenario, choiceId, profile);
    const next = recordPhase23Learning(history, evaluation, history.length + 1, scenario.category, scenario.skills);
    setHistory(next);
    setMessage(`${evaluation.quality.toUpperCase()} · ${Math.round(evaluation.score)}/100 — ${evaluation.explanation}`);
    try { await saveBusiness(SAVE_KEY, next); } catch { /* local progress remains available */ }
  }

  if (loading) return <main className="learning-page"><section className="learning-card"><p>Loading your founder profile…</p></section></main>;

  return <main className="learning-page">
    <header className="learning-header"><div><div className="eyebrow">EnterpriseVerse · Phase 23</div><h1>Train your founder judgement.</h1><p>Every challenge adapts to what you do well, what you miss and what the business world is asking from you next.</p></div><div className="learning-header-actions"><Link className="learning-back" href="/intelligence">Enterprise Intelligence →</Link><Link className="learning-back" href="/">Back to simulation</Link></div></header>

    <section className="learning-grid">
      <article className="learning-card profile-card"><div className="eyebrow">Founder profile</div><h2>{debrief.founderStyle}</h2><div className="profile-score"><strong>{Math.round(debrief.score)}</strong><span>average decision quality</span></div><div className="skill-list">{Object.entries(profile.skills).map(([skill, value]) => <div key={skill}><div><span>{skill}</span><strong>{Math.round(value)}</strong></div><div className="skill-bar"><i style={{ width: `${value}%` }} /></div></div>)}</div></article>

      <article className="learning-card challenge-card"><div className="eyebrow">Adaptive challenge · {challenge.reason.replaceAll("_", " ")}</div><h2>{scenario.title}</h2><p className="scenario-situation">{scenario.situation}</p><div className="why"><strong>Why this matters</strong><span>{scenario.whyItMatters}</span></div><div className="choice-grid">{scenario.choices.map((choice) => <button key={choice.id} type="button" onClick={() => void choose(choice.id)}><strong>{choice.label}</strong><span>{choice.description}</span><small>Risk {choice.risk}/100 · delayed impact {choice.delayedEffect > 0 ? "+" : ""}{choice.delayedEffect}</small></button>)}</div>{message && <p className="learning-result" role="status">{message}</p>}<p className="lesson"><strong>Concept:</strong> {scenario.lesson}</p></article>

      <article className="learning-card"><div className="eyebrow">Your blind spots</div><h2>What to practise next</h2><ul className="insight-list">{debrief.blindSpots.map((item) => <li key={item}>{item}</li>)}</ul><div className="eyebrow spaced">Recent lessons</div><ul className="insight-list">{debrief.lessons.length ? debrief.lessons.map((item) => <li key={item}>{item}</li>) : <li>Complete your first challenge to start building a personal learning history.</li>}</ul></article>

      <article className="learning-card"><div className="eyebrow">Replay intelligence</div><h2>Same business. New judgement.</h2><p>Phase 23 does not simply repeat lessons. It uses your recent decisions and weakest skills to select the next challenge, while keeping challenge generation deterministic.</p><div className="signature"><span>Challenge signature</span><code>{phase23Signature(challenge, history)}</code></div><div className="scenario-picker"><label>Explore another scenario<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">Recommended for me</option>{getPhase23Scenarios().map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></div></article>
    </section>
  </main>;
}
