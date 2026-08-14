'use client';

import { useMemo, useState } from 'react';

type Priority = 'critical' | 'high' | 'medium' | 'low';
type Signal = { id: string; priority: Priority; kind: string; title: string; reason: string; day: number; entity: string };
const priorityRank: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function AttentionQueue({ signals, onOpen }: { signals: Signal[]; onOpen?: (signal: Signal) => void }) {
  const [filter, setFilter] = useState<Priority | 'all'>('all');
  const visible = useMemo(() => [...signals].filter((s) => filter === 'all' || s.priority === filter).sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.day - a.day), [signals, filter]);
  return <section className="ev-core-card ev-attention-queue"><div className="ev-core-head"><div><span className="ev-ds-eyebrow">ATTENTION ENGINE</span><h2>What needs you now?</h2><p>Signals are ranked by urgency and recency, not arrival order.</p></div><div className="ev-filter-row">{(['all', 'critical', 'high', 'medium', 'low'] as const).map((value) => <button type="button" key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div></div><div className="ev-signal-grid">{visible.length === 0 ? <div className="ev-core-empty">Nothing at this priority.</div> : visible.map((signal) => <button type="button" className={`ev-core-signal priority-${signal.priority}`} key={signal.id} onClick={() => onOpen?.(signal)}><span className="ev-signal-priority">{signal.priority}</span><span className="ev-signal-copy"><b>{signal.title}</b><small>{signal.entity} · DAY {signal.day}</small><span>{signal.reason}</span></span><span aria-hidden="true">→</span></button>)}</div></section>;
}

export function CausalChain({ nodes, onInspect }: { nodes: { id: string; label: string; value?: string; description?: string }[]; onInspect?: (id: string) => void }) {
  return <section className="ev-core-card"><div className="ev-core-head"><div><span className="ev-ds-eyebrow">CAUSALITY</span><h2>Why is this happening?</h2><p>Trace the chain instead of reading isolated metrics.</p></div></div><div className="ev-causal-chain">{nodes.map((node, index) => <div className="ev-causal-step" key={node.id}><button type="button" onClick={() => onInspect?.(node.id)}><b>{node.label}</b>{node.value && <strong>{node.value}</strong>}{node.description && <small>{node.description}</small>}</button>{index < nodes.length - 1 && <span className="ev-causal-arrow" aria-hidden="true">↓</span>}</div>)}</div></section>;
}

export function ScenarioCompare({ baseline, scenarios, onSelect }: { baseline: { label: string; value: string }[]; scenarios: { id: string; name: string; values: string[]; delta: string }[]; onSelect?: (id: string) => void }) {
  return <section className="ev-core-card"><div className="ev-core-head"><div><span className="ev-ds-eyebrow">WHAT-IF LAB</span><h2>Compare possible futures</h2><p>Explore a scenario without changing the live enterprise.</p></div></div><div className="ev-scenario-table"><div className="ev-scenario-row ev-scenario-baseline"><b>LIVE</b>{baseline.map((item) => <span key={item.label}><small>{item.label}</small><strong>{item.value}</strong></span>)}</div>{scenarios.map((scenario) => <button type="button" className="ev-scenario-row" key={scenario.id} onClick={() => onSelect?.(scenario.id)}><b>{scenario.name}</b>{scenario.values.map((value, index) => <span key={index}><small>{baseline[index]?.label}</small><strong>{value}</strong></span>)}<em>{scenario.delta}</em></button>)}</div></section>;
}

export function DecisionTimeline({ events, onOpen }: { events: { id: string; day: number; type: string; title: string; outcome?: string }[]; onOpen?: (event: { id: string; day: number; type: string; title: string; outcome?: string }) => void }) {
  return <section className="ev-core-card"><div className="ev-core-head"><div><span className="ev-ds-eyebrow">DECISION MEMORY</span><h2>Your enterprise, remembered</h2><p>Decisions, outcomes and turning points in one timeline.</p></div></div><div className="ev-decision-timeline">{events.map((event) => <button type="button" key={event.id} onClick={() => onOpen?.(event)}><span>DAY {event.day}</span><div><small>{event.type}</small><b>{event.title}</b>{event.outcome && <p>{event.outcome}</p>}</div><i aria-hidden="true">→</i></button>)}</div></section>;
}

type Notification = { id: string; title: string; body: string; unread?: boolean; action?: React.ReactNode };
export function NotificationCenter({ notifications, onAction }: { notifications: Notification[]; onAction?: (id: string) => void }) {
  return <aside className="ev-core-card ev-notification-center"><div className="ev-core-head"><div><span className="ev-ds-eyebrow">NOTIFICATIONS</span><h2>Signals, not noise</h2></div></div>{notifications.map((n) => <article className={`ev-notification ${n.unread ? 'unread' : ''}`} key={n.id}><button type="button" className="ev-notification-main" onClick={() => onAction?.(n.id)}><span className="ev-notification-dot" aria-hidden="true" /><span><b>{n.title}</b><p>{n.body}</p></span></button>{n.action && <div className="ev-notification-action">{n.action}</div>}</article>)}</aside>;
}

export function IntelligenceSearch({ placeholder = 'Search people, decisions, events, metrics…', onSearch }: { placeholder?: string; onSearch?: (query: string) => void }) {
  const [query, setQuery] = useState('');
  return <div className="ev-intelligence-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(e) => { setQuery(e.target.value); onSearch?.(e.target.value); }} placeholder={placeholder} aria-label="Search enterprise intelligence" /><kbd>⌘ K</kbd></div>;
}
