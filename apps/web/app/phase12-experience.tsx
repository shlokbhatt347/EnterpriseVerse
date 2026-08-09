"use client";

import type { ReactNode } from "react";

export type Trend = "up" | "down" | "flat";
export type Tone = "positive" | "negative" | "neutral" | "warning";

export interface AnalyticsPoint {
  label: string;
  value: number;
}

export interface TimelineEvent {
  id: string;
  day: number;
  title: string;
  description: string;
  kind?: "decision" | "milestone" | "event" | "consequence";
}

export interface WorldActor {
  id: string;
  name: string;
  kind: "competitor" | "customer" | "supplier" | "employee";
  relationship: number;
  activity: number;
}

export function AttentionPanel({ items }: { items: { title: string; detail: string; tone?: Tone }[] }) {
  if (!items.length) return <div className="p12-empty"><strong>Nothing needs your attention.</strong><span>Your enterprise is operating normally.</span></div>;
  return <section className="p12-attention" aria-labelledby="attention-heading"><div><span className="p12-eyebrow">COMMAND CENTRE</span><h2 id="attention-heading">What needs attention now?</h2></div><div className="p12-attention-list">{items.map((item) => <article className={`p12-attention-item ${item.tone ?? "neutral"}`} key={`${item.title}-${item.detail}`}><span className="p12-status-dot" aria-hidden="true" /><div><strong>{item.title}</strong><p>{item.detail}</p></div></article>)}</div></section>;
}

export function AnalyticsCard({ title, value, unit, trend = "flat", points = [] }: { title: string; value: string; unit?: string; trend?: Trend; points?: AnalyticsPoint[] }) {
  const max = Math.max(1, ...points.map((point) => point.value));
  return <section className="p12-panel" aria-label={title}><div className="p12-panel-head"><div><span className="p12-label">{title}</span><div className="p12-big-number">{value}{unit && <small>{unit}</small>}</div></div><span className={`p12-trend ${trend}`}>{trend === "up" ? "↗ Improving" : trend === "down" ? "↘ Declining" : "→ Stable"}</span></div>{points.length > 1 && <div className="p12-spark" role="img" aria-label={`${title} historical trend`}><div className="p12-spark-bars">{points.map((point) => <span key={point.label} title={`${point.label}: ${point.value}`} style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }} />)}</div><div className="p12-axis"><span>{points[0].label}</span><span>{points[points.length - 1].label}</span></div></div>}</section>;
}

export function BusinessTimeline({ events }: { events: TimelineEvent[] }) {
  return <section className="p12-panel" aria-labelledby="timeline-heading"><div className="p12-panel-head"><div><span className="p12-eyebrow">BUSINESS MEMORY</span><h2 id="timeline-heading">Enterprise timeline</h2></div><span className="p12-label">{events.length} moments</span></div>{events.length ? <ol className="p12-timeline">{events.map((event) => <li key={event.id}><span className={`p12-timeline-marker ${event.kind ?? "event"}`} aria-hidden="true" /><div><span className="p12-timeline-day">DAY {event.day}</span><h3>{event.title}</h3><p>{event.description}</p></div></li>)}</ol> : <div className="p12-empty"><strong>Your story starts here.</strong><span>Important decisions, milestones and consequences will appear on this timeline.</span></div>}</section>;
}

export function LivingWorldPanel({ actors }: { actors: WorldActor[] }) {
  return <section className="p12-panel" aria-labelledby="world-heading"><div className="p12-panel-head"><div><span className="p12-eyebrow">LIVING WORLD</span><h2 id="world-heading">People & market around you</h2></div><span className="p12-label">{actors.length} actors</span></div>{actors.length ? <div className="p12-actors">{actors.map((actor) => <article className="p12-actor" key={actor.id}><div className="p12-actor-icon" aria-hidden="true">{actor.kind === "competitor" ? "C" : actor.kind === "customer" ? "K" : actor.kind === "supplier" ? "S" : "E"}</div><div className="p12-actor-main"><strong>{actor.name}</strong><span>{actor.kind}</span><div className="p12-meter"><i style={{ width: `${Math.max(0, Math.min(100, actor.relationship))}%` }} /></div><small>Relationship {Math.round(actor.relationship)} · Activity {Math.round(actor.activity)}</small></div></article>)}</div> : <div className="p12-empty"><strong>The world is waiting.</strong><span>Customers, suppliers, employees and competitors will populate this view as the enterprise develops.</span></div>}</section>;
}

export function RunSummary({ title, stats, strengths, weaknesses, onReplay, onNewBusiness }: { title: string; stats: { label: string; value: ReactNode }[]; strengths: string[]; weaknesses: string[]; onReplay?: () => void; onNewBusiness?: () => void }) {
  return <section className="p12-run" aria-labelledby="run-summary-heading"><span className="p12-eyebrow">END OF RUN</span><h2 id="run-summary-heading">{title}</h2><div className="p12-run-stats">{stats.map((stat) => <div key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></div>)}</div><div className="p12-run-columns"><div><h3>What worked</h3>{strengths.length ? <ul>{strengths.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No strengths recorded yet.</p>}</div><div><h3>What to improve</h3>{weaknesses.length ? <ul>{weaknesses.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No major weaknesses recorded.</p>}</div></div><div className="p12-run-actions">{onReplay && <button type="button" className="p12-button secondary" onClick={onReplay}>Replay run</button>}{onNewBusiness && <button type="button" className="p12-button primary" onClick={onNewBusiness}>Start new business</button>}</div></section>;
}
