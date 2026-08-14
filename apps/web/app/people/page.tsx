'use client';

import { useEffect, useMemo, useState } from "react";
import { createWorkforce, interactWithEmployee } from "@enterpriseverse/simulation";
import type { SimulationState } from "@enterpriseverse/types";
import "./people.css";

const SAVE_KEY = "enterpriseverse:active-business:v1";
type Interaction = "support" | "challenge" | "listen" | "reject";

export default function PeoplePage() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [selectedId, setSelectedId] = useState("employee-maya-product");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (raw) setState(JSON.parse(raw) as SimulationState);
    } catch { window.localStorage.removeItem(SAVE_KEY); }
  }, []);

  useEffect(() => { if (state) window.localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }, [state]);

  const workforce = useMemo(() => {
    if (!state) return null;
    return state.workforce ?? createWorkforce(state.business.day);
  }, [state]);
  const selected = workforce?.employees.find((employee) => employee.id === selectedId) ?? workforce?.employees[0];
  const living = selected as typeof selected & { goals?: string[]; trust?: number; relationship?: number; mood?: string; memories?: { day: number; summary: string; sentiment: number }[] };
  const attention = useMemo(() => {
    if (!living) return null;
    if ((living.mood === "concerned") || (living.morale ?? 0) < 50) return { tone: "urgent", title: `${living.name} may need your attention`, text: "Workload or morale is creating relationship risk. A conversation now can change the trajectory." };
    if ((living.trust ?? 70) < 55) return { tone: "watch", title: `${living.name} is losing confidence`, text: "Your relationship has weakened. Listening before making another decision may prevent a deeper trust gap." };
    return { tone: "positive", title: `${living.name} is aligned`, text: "The relationship is healthy. This is a good moment to reinforce the behaviours you want from the team." };
  }, [living]);

  const interact = (interaction: Interaction) => {
    if (!state || !selected) return;
    const nextWorkforce = interactWithEmployee(workforce ?? createWorkforce(state.business.day), selected.id, state.business.day, interaction);
    setState({ ...state, workforce: nextWorkforce });
    setMessage(`${selected.name} reacted to your ${interaction} conversation. The relationship and memory have been updated.`);
  };

  if (!state || !workforce) return <main className="people-empty"><span>ENTERPRISEVERSE · PEOPLE</span><h1>Build relationships, not just headcount.</h1><p>Start an enterprise first. Your living people will appear here.</p><a href="/EnterpriseVerse/">Open simulator →</a></main>;

  return <main className="people-shell">
    <header className="people-topbar"><a href="/experience3">ENTERPRISEVERSE</a><div><span className="people-live" /> PEOPLE COMMAND CENTER</div><span>DAY {state.business.day} · {state.business.name}</span></header>
    <div className="people-layout">
      <aside className="people-list">
        <div className="people-list-head"><span>YOUR PEOPLE</span><strong>{workforce.employees.length} ACTORS</strong></div>
        {workforce.employees.map((employee) => { const actor = employee as typeof employee & { mood?: string; trust?: number; relationship?: number }; return <button key={employee.id} className={selected?.id === employee.id ? "person active" : "person"} onClick={() => setSelectedId(employee.id)}><span className="person-avatar">{employee.name.slice(0,1)}</span><span className="person-copy"><b>{employee.name}</b><small>{employee.role} · {actor.mood ?? "neutral"}</small></span><span className="person-trust">{Math.round(actor.trust ?? employee.loyalty)}</span></button>; })}
        <div className="people-list-note"><b>Living enterprise</b><p>People remember meaningful interactions. Their trust, mood and relationship with you can change future behaviour.</p></div>
      </aside>

      <section className="people-main">
        {attention && <section className={`people-attention ${attention.tone}`}><span>ATTENTION</span><div><strong>{attention.title}</strong><p>{attention.text}</p></div></section>}
        {selected && <>
          <header className="person-hero"><div className="large-avatar">{selected.name.slice(0,1)}</div><div><span className="people-kicker">{selected.role.toUpperCase()} · DAY {selected.employedDay}</span><h1>{selected.name}</h1><p>Persistent actor · relationship-aware simulation</p></div><span className={`mood mood-${living.mood ?? "neutral"}`}>{(living.mood ?? "neutral").toUpperCase()}</span></header>

          <div className="relationship-grid"><article><span>TRUST</span><strong>{Math.round(living.trust ?? 70)}</strong><i><em style={{width:`${living.trust ?? 70}%`}} /></i></article><article><span>RELATIONSHIP</span><strong>{Math.round(living.relationship ?? 62)}</strong><i><em style={{width:`${living.relationship ?? 62}%`}} /></i></article><article><span>MORALE</span><strong>{Math.round(selected.morale)}</strong><i><em style={{width:`${selected.morale}%`}} /></i></article><article><span>INFLUENCE</span><strong>{Math.round(selected.productivity)}</strong><i><em style={{width:`${selected.productivity}%`}} /></i></article></div>

          <div className="people-columns">
            <section className="people-card"><span className="people-kicker">MOTIVATION</span><h2>What {selected.name} wants</h2><div className="goal-list">{(living.goals ?? ["Perform strongly", "Grow with the company"]).map((goal) => <div key={goal}><span>◎</span><b>{goal}</b></div>)}</div></section>
            <section className="people-card"><span className="people-kicker">RELATIONSHIP MEMORY</span><h2>What they remember</h2><div className="memory-list">{(living.memories ?? []).slice().reverse().slice(0,4).map((memory, index) => <div key={`${memory.day}-${index}`}><span>DAY {memory.day}</span><p>{memory.summary}</p><b className={memory.sentiment >= 0 ? "good" : "bad"}>{memory.sentiment >= 0 ? "+" : "−"}</b></div>)}</div></section>
          </div>

          <section className="conversation"><div><span className="people-kicker">CONVERSATION</span><h2>How do you want to respond?</h2><p>Your choice changes trust, relationship, morale and future memory.</p></div><div className="conversation-actions"><button onClick={() => interact("listen")}><b>Listen</b><small>Understand concerns</small></button><button onClick={() => interact("support")}><b>Support</b><small>Reinforce their direction</small></button><button onClick={() => interact("challenge")}><b>Challenge</b><small>Demand stronger reasoning</small></button><button onClick={() => interact("reject")}><b>Reject</b><small>Hold the current line</small></button></div></section>
          <p className="people-status" role="status" aria-live="polite">{message}</p>
        </>}
      </section>
    </div>
  </main>;
}
