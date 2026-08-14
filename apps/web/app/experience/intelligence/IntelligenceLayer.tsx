"use client";

import { useMemo, useState } from "react";
import type { AttentionSignal, CausalChain, ContextPanel, Decision, MemoryEvent } from "./types";
import { rankAttention, recommendDecision } from "./engine";
import "./intelligence.css";

export function EVAttentionCenter({ signals }: { signals: AttentionSignal[] }) {
  const items = useMemo(() => rankAttention(signals), [signals]);
  return <section className="ev-intel-panel"><header className="ev-intel-header"><div><span className="ev-eyebrow">Attention</span><h2 className="ev-title-md">What needs you?</h2></div><span className="ev-intel-count">{items.filter((x) => x.priority !== "background").length}</span></header><div className="ev-intel-list">{items.map((item) => <a key={item.id} href={item.href ?? "#"} className={`ev-signal ev-signal-${item.priority}`}><i aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.reason}</small></span></a>)}</div></section>;
}

export function EVContextPanel({ context }: { context: ContextPanel }) {
  return <section className="ev-intel-panel"><header className="ev-intel-header"><div><span className="ev-eyebrow">Context</span><h2 className="ev-title-md">{context.entity.label}</h2></div><span className="ev-chip">{context.entity.type}</span></header><div className="ev-context-summary">{context.summary}</div><div className="ev-facts">{context.facts.map((fact) => <div key={fact.label}><span>{fact.label}</span><strong className={fact.tone === "positive" ? "ev-success" : fact.tone === "negative" ? "ev-critical" : fact.tone === "warning" ? "ev-warning" : ""}>{fact.value}</strong></div>)}</div>{context.connectedEntities?.length ? <div className="ev-connected"><span className="ev-eyebrow">Connected</span>{context.connectedEntities.map((entity) => <span key={entity.id} className="ev-chip">{entity.label}</span>)}</div> : null}</section>;
}

export function EVCausalityPanel({ chain }: { chain: CausalChain }) {
  const labels = new Map(chain.nodes.map((node) => [node.id, node.label]));
  return <section className="ev-intel-panel"><header className="ev-intel-header"><div><span className="ev-eyebrow">Causality</span><h2 className="ev-title-md">Why did this happen?</h2></div><span className="ev-status ev-status-info">{chain.confidence} confidence</span></header><p className="ev-body" style={{ marginBottom: 16 }}>{chain.headline}</p><div className="ev-causal-chain">{chain.nodes.map((node, index) => <div key={node.id} className="ev-causal-node"><div className="ev-causal-node-box"><strong>{node.label}</strong>{node.value ? <small>{node.value}</small> : null}</div>{index < chain.nodes.length - 1 ? <div className="ev-causal-arrow" aria-hidden="true">↓</div> : null}</div>)}</div>{chain.edges.length ? <details className="ev-causal-details"><summary>Explain the links</summary>{chain.edges.map((edge) => <p key={`${edge.from}-${edge.to}`}><strong>{labels.get(edge.from)}</strong> → <strong>{labels.get(edge.to)}</strong>: {edge.explanation}</p>)}</details> : null}</section>;
}

export function EVDecisionPanel({ decision, onChoose }: { decision: Decision; onChoose?: (optionId: string) => void }) {
  const options = useMemo(() => recommendDecision(decision), [decision]);
  const [selected, setSelected] = useState<string | null>(null);
  return <section className="ev-intel-panel"><header className="ev-intel-header"><div><span className="ev-eyebrow">Decision</span><h2 className="ev-title-md">{decision.title}</h2></div>{decision.deadlineTurn ? <span className="ev-status ev-status-warning">Turn {decision.deadlineTurn}</span> : null}</header><p className="ev-body">{decision.situation}</p><div className="ev-decision-options">{options.map((option) => <button key={option.id} type="button" className={`ev-decision-option ${selected === option.id ? "selected" : ""}`} onClick={() => setSelected(option.id)}><div className="ev-decision-top"><div><strong>{option.label}</strong><small>{option.summary}</small></div><span className={`ev-status ev-status-${option.risk === "high" ? "critical" : option.risk === "medium" ? "warning" : "success"}`}>{option.risk} risk</span></div><div className="ev-option-meta"><span>Cost {option.cost ?? "—"}</span><span>Time {option.time ?? "—"}</span><span>{option.confidence} confidence</span></div><div className="ev-option-effects">{option.effects.map((effect) => <span key={effect.label} className={effect.direction === "positive" ? "ev-success" : effect.direction === "negative" ? "ev-critical" : "ev-muted"}>{effect.label} {effect.value}</span>)}</div></button>)}</div>{selected ? <div className="ev-decision-confirm"><span>Selected option: <strong>{options.find((x) => x.id === selected)?.label}</strong></span><button type="button" className="ev-button ev-button-primary" onClick={() => onChoose?.(selected)}>Commit decision</button></div> : null}</section>;
}

export function EVMemoryTimeline({ events }: { events: MemoryEvent[] }) {
  return <section className="ev-intel-panel"><header className="ev-intel-header"><div><span className="ev-eyebrow">Memory</span><h2 className="ev-title-md">Your enterprise history</h2></div><span className="ev-caption">{events.length} events</span></header><div className="ev-memory">{events.map((event) => <article key={event.id} className="ev-memory-item"><div className="ev-memory-turn">D{event.turn}</div><div><strong>{event.title}</strong><p>{event.description}</p></div>{event.outcome ? <span className={`ev-status ev-status-${event.outcome === "positive" ? "success" : event.outcome === "negative" ? "critical" : "info"}`}>{event.outcome}</span> : null}</article>)}</div></section>;
}

export function EVExperienceIntelligence({ attention, context, causality, decision, memory, onChoose }: { attention: AttentionSignal[]; context?: ContextPanel; causality?: CausalChain; decision?: Decision; memory: MemoryEvent[]; onChoose?: (optionId: string) => void }) {
  return <div className="ev-intelligence-grid"><div className="ev-intelligence-main">{decision ? <EVDecisionPanel decision={decision} onChoose={onChoose} /> : null}{causality ? <EVCausalityPanel chain={causality} /> : null}{memory.length ? <EVMemoryTimeline events={memory} /> : null}</div><aside className="ev-intelligence-side"><EVAttentionCenter signals={attention} />{context ? <EVContextPanel context={context} /> : null}</aside></div>;
}
