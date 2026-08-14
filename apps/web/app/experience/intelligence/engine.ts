import type { AttentionSignal, CausalChain, ContextPanel, Decision, MemoryEvent } from "./types";

export function rankAttention(signals: AttentionSignal[]): AttentionSignal[] {
  const weight = { critical: 4, important: 3, signal: 2, background: 1 } as const;
  return [...signals].sort((a, b) => weight[b.priority] - weight[a.priority] || Number(Boolean(b.unread)) - Number(Boolean(a.unread)) || a.id.localeCompare(b.id));
}

export function buildContext(entity: ContextPanel["entity"], summary: string, facts: ContextPanel["facts"], connectedEntities: ContextPanel["connectedEntities"] = []): ContextPanel {
  return { entity, summary, facts, connectedEntities };
}

export function explainCausality(chain: CausalChain): string {
  if (chain.nodes.length < 2) return chain.headline;
  return chain.nodes.map((node) => node.label).join(" → ");
}

export function recommendDecision(decision: Decision): Decision["options"] {
  const riskWeight = { low: 3, medium: 2, high: 1 } as const;
  const confidenceWeight = { high: 3, medium: 2, low: 1 } as const;
  return [...decision.options].sort((a, b) => riskWeight[b.risk] + confidenceWeight[b.confidence] - (riskWeight[a.risk] + confidenceWeight[a.confidence)));
}

export function remember(memory: MemoryEvent[], event: MemoryEvent, max = 100): MemoryEvent[] {
  return [event, ...memory.filter((item) => item.id !== event.id)].sort((a, b) => b.turn - a.turn).slice(0, max);
}
