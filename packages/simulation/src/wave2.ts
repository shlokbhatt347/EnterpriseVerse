import type { SimulationState } from "@enterpriseverse/types";
import { calculateKpis } from "./operations";
import { runWhatIf, type WhatIfInput, type WhatIfResult } from "./intelligence";

export type AttentionPriority = "critical" | "high" | "medium" | "low";
export type AttentionSignal = { id: string; priority: AttentionPriority; kind: string; title: string; reason: string; day: number; entity: string; score: number; action: string };
export type CausalNode = { id: string; label: string; value: string; description: string; weight: number };
export type DecisionMemory = { id: string; day: number; type: string; title: string; outcome: string };
export type EnterpriseNotification = { id: string; priority: AttentionPriority; title: string; body: string; day: number; unread: boolean };
export type SearchResult = { id: string; type: "business" | "customer" | "supplier" | "event" | "decision" | "metric"; title: string; detail: string; score: number };
const rank: Record<AttentionPriority, number> = { critical: 100, high: 75, medium: 50, low: 25 };
const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const money = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function buildAttentionSignals(state: SimulationState): AttentionSignal[] {
  const k = calculateKpis(state), signals: AttentionSignal[] = [];
  const add = (s: Omit<AttentionSignal, "score">) => signals.push({ ...s, score: rank[s.priority] });
  if (k.cashRunwayDays < 7) add({ id: "cash-critical", priority: "critical", kind: "FINANCE", title: "Cash runway is critical", reason: `Only ${k.cashRunwayDays} days of runway remain with ${money(state.business.cash)} cash.`, day: state.business.day, entity: state.business.name, action: "Review cash commitments" });
  else if (k.cashRunwayDays < 14) add({ id: "cash-high", priority: "high", kind: "FINANCE", title: "Cash runway is tightening", reason: `${k.cashRunwayDays} days of runway remain.`, day: state.business.day, entity: state.business.name, action: "Review spending and financing" });
  if (k.grossMargin < 20) add({ id: "margin-pressure", priority: "high", kind: "FINANCE", title: "Margin pressure needs attention", reason: `Gross margin is ${k.grossMargin}%.`, day: state.business.day, entity: state.business.name, action: "Inspect unit economics" });
  if ((state.economy?.supplyChain?.stockoutDays ?? 0) > 0) add({ id: "stockout", priority: "high", kind: "OPERATIONS", title: "Stockouts are leaking demand", reason: `${state.economy?.supplyChain?.stockoutDays} stockout day(s) recorded.`, day: state.business.day, entity: state.business.name, action: "Review supply resilience" });
  if ((state.workforce?.moraleIndex ?? 100) < 65) add({ id: "morale", priority: "medium", kind: "PEOPLE", title: "Workforce morale is becoming a constraint", reason: `Morale is ${Math.round(state.workforce?.moraleIndex ?? 0)}/100.`, day: state.business.day, entity: state.business.name, action: "Inspect workforce" });
  if ((state.market?.competitivePressure ?? 0) > 70) add({ id: "competition", priority: "high", kind: "MARKET", title: "Competitive pressure is elevated", reason: `Competitive pressure is ${Math.round(state.market?.competitivePressure ?? 0)}/100.`, day: state.business.day, entity: state.business.name, action: "Inspect market position" });
  if (state.business.reputation < 40) add({ id: "reputation", priority: "medium", kind: "CUSTOMERS", title: "Reputation is becoming a risk", reason: `Reputation is ${Math.round(state.business.reputation)}/100.`, day: state.business.day, entity: state.business.name, action: "Inspect customer trust" });
  for (const event of (state.events ?? []).slice(0, 4)) add({ id: `event-${event.id}`, priority: event.choices?.length ? "medium" : "low", kind: "WORLD EVENT", title: event.title, reason: event.message, day: event.day, entity: state.business.name, action: event.choices?.length ? "Review decision" : "Inspect event" });
  return signals.sort((a, b) => b.score - a.score || b.day - a.day).slice(0, 12);
}

export function buildCausalChain(state: SimulationState, focus: "cash" | "revenue" | "market" | "people" = "cash"): CausalNode[] {
  const k = calculateKpis(state);
  if (focus === "market") return [
    { id: "competition", label: "Competitive pressure", value: `${Math.round(state.market?.competitivePressure ?? 0)}/100`, description: "External pressure changes relative attractiveness.", weight: 0.8 },
    { id: "demand", label: "Demand index", value: `${Math.round(state.market?.demandIndex ?? 100)}`, description: `Market trend: ${state.market?.trend ?? "stable"}.`, weight: 0.9 },
    { id: "share", label: "Market share", value: `${state.business.marketShare.toFixed(1)}%`, description: "Share reflects fulfilled demand and competitive position.", weight: 1 },
  ];
  if (focus === "revenue") return [
    { id: "price", label: "Operating price", value: money(state.operations?.price ?? 0), description: "Price interacts with demand and elasticity.", weight: 0.7 },
    { id: "demand", label: "Demand index", value: `${Math.round(state.market?.demandIndex ?? 100)}`, description: "Available market demand.", weight: 0.9 },
    { id: "inventory", label: "Inventory available", value: `${state.business.inventory}`, description: "Inventory limits fulfilled sales.", weight: 0.8 },
    { id: "revenue", label: "Revenue", value: money(state.business.revenue), description: "Cumulative realized revenue.", weight: 1 },
  ];
  if (focus === "people") return [
    { id: "morale", label: "Workforce morale", value: `${Math.round(state.workforce?.moraleIndex ?? 0)}/100`, description: "Morale influences sustainable productivity.", weight: 0.9 },
    { id: "productivity", label: "Productivity", value: `${Math.round(state.workforce?.productivityIndex ?? 0)}/100`, description: "Current workforce output capability.", weight: 0.9 },
    { id: "capacity", label: "Employees", value: `${state.workforce?.employees.length ?? 0}`, description: "Available people capacity.", weight: 0.7 },
  ];
  return [
    { id: "revenue", label: "Revenue", value: money(state.business.revenue), description: "Cash inflow from realized sales.", weight: 0.8 },
    { id: "expenses", label: "Expenses", value: money(state.business.expenses), description: "Operating and procurement outflow.", weight: 0.8 },
    { id: "profit", label: "Profit", value: money(k.profit), description: "Revenue less modeled costs.", weight: 0.9 },
    { id: "runway", label: "Cash runway", value: `${k.cashRunwayDays} days`, description: "Estimated operating survival at current burn.", weight: 1 },
  ];
}

export function buildDecisionMemory(state: SimulationState): DecisionMemory[] { return (state.replay?.decisions ?? []).map((choice, index) => ({ id: `${choice}-${index}`, day: Math.max(1, state.business.day - ((state.replay?.decisions?.length ?? 1) - index - 1)), type: "DECISION", title: choice, outcome: "Recorded in enterprise memory; inspect nearby events for downstream effects." })); }
export function buildNotifications(state: SimulationState): EnterpriseNotification[] { return buildAttentionSignals(state).slice(0, 8).map((s) => ({ id: s.id, priority: s.priority, title: s.title, body: `${s.reason} ${s.action}.`, day: s.day, unread: s.priority === "critical" || s.priority === "high" })); }
function score(q: string, text: string) { return q.toLowerCase().split(/\s+/).filter(Boolean).reduce((n, token) => n + (text.toLowerCase().includes(token) ? 3 : 0), 0); }
export function searchEnterprise(state: SimulationState, query: string): SearchResult[] {
  if (!query.trim()) return [];
  const results: SearchResult[] = [];
  const add = (r: Omit<SearchResult, "score">) => { const s = score(query, `${r.title} ${r.detail}`); if (s) results.push({ ...r, score: s }); };
  add({ id: state.business.id, type: "business", title: state.business.name, detail: `${state.business.industry} · Day ${state.business.day}` });
  state.business.customers.forEach((c) => add({ id: c.id, type: "customer", title: c.name, detail: `${c.segment} customer · trust ${Math.round(c.trust)}` }));
  state.business.suppliers.forEach((s) => add({ id: s.id, type: "supplier", title: s.name, detail: `reliability ${Math.round(s.reliability)} · relationship ${Math.round(s.relationship)}` }));
  (state.events ?? []).forEach((e) => add({ id: e.id, type: "event", title: e.title, detail: e.message }));
  buildDecisionMemory(state).forEach((d) => add({ id: d.id, type: "decision", title: d.title, detail: `${d.type} · Day ${d.day}` }));
  const k = calculateKpis(state);
  [{ id: "cash", title: "Cash", detail: money(state.business.cash) }, { id: "revenue", title: "Revenue", detail: money(state.business.revenue) }, { id: "runway", title: "Cash runway", detail: `${k.cashRunwayDays} days` }, { id: "share", title: "Market share", detail: `${state.business.marketShare.toFixed(1)}%` }].forEach((m) => add({ ...m, type: "metric" }));
  return results.sort((a, b) => b.score - a.score).slice(0, 20);
}
export function compareWave2Scenario(state: SimulationState, input: WhatIfInput): WhatIfResult { return runWhatIf(state, input); }
export function buildWave2Snapshot(state: SimulationState) { return { attention: buildAttentionSignals(state), causality: buildCausalChain(state), decisions: buildDecisionMemory(state), notifications: buildNotifications(state), day: state.business.day }; }
