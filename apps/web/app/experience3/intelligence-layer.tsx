'use client';

import type { SimulationState } from "@enterpriseverse/types";
import { calculateKpis } from "@enterpriseverse/simulation";
import { AttentionQueue, CausalChain, DecisionTimeline, IntelligenceSearch, NotificationCenter, ScenarioCompare } from "./core-intelligence";
import { SectionHeader, Surface } from "./design-system";

const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

type Signal = { id: string; priority: "critical" | "high" | "medium" | "low"; kind: string; title: string; reason: string; day: number; entity: string };
type Decision = { id: string; day: number; type: string; title: string; outcome?: string };

export function IntelligenceLayer({ state, onAttention, onDecision, onScenario }: { state: SimulationState; onAttention?: (signal: Signal) => void; onDecision?: (event: Decision) => void; onScenario?: (id: string) => void }) {
  const kpis = calculateKpis(state);
  const signals: Signal[] = [
    ...(state.events ?? []).map((event, index) => ({ id: event.id, priority: index === 0 ? "high" as const : "medium" as const, kind: "WORLD EVENT", title: event.title, reason: event.message, day: event.day, entity: state.business.name })),
    ...(kpis.cashRunwayDays < 14 ? [{ id: "cash-runway", priority: "critical" as const, kind: "FINANCE", title: "Cash runway is tightening", reason: `${kpis.cashRunwayDays} days of runway remain.`, day: state.business.day, entity: state.business.name }] : []),
    ...(state.business.marketShare < 10 ? [{ id: "market-share", priority: "high" as const, kind: "MARKET", title: "Market position needs attention", reason: `Market share is ${state.business.marketShare.toFixed(1)}%.`, day: state.business.day, entity: state.business.name }] : []),
  ];
  const decisions: Decision[] = (state.replay?.decisions ?? []).map((choice, index) => ({ id: `${choice}-${index}`, day: index + 1, type: "DECISION", title: choice, outcome: "Recorded in enterprise memory." }));
  const baseline = [
    { label: "Cash", value: money(state.business.cash) },
    { label: "Revenue", value: money(state.business.revenue) },
    { label: "Share", value: `${state.business.marketShare.toFixed(1)}%` },
  ];
  const scenarios = [
    { id: "price-up", name: "Raise price", values: [money(state.business.cash), money(Math.max(0, state.business.revenue * 1.08)), `${Math.max(0, state.business.marketShare - 0.6).toFixed(1)}%`], delta: "margin ↑ / demand ↓" },
    { id: "quality-up", name: "Invest in quality", values: [money(Math.max(0, state.business.cash - 1000)), money(state.business.revenue * 1.05), `${(state.business.marketShare + 0.4).toFixed(1)}%`], delta: "cash ↓ / reputation ↑" },
    { id: "marketing", name: "Increase marketing", values: [money(Math.max(0, state.business.cash - 1000)), money(state.business.revenue * 1.12), `${(state.business.marketShare + 0.8).toFixed(1)}%`], delta: "cash ↓ / demand ↑" },
  ];
  const causalNodes = [
    { id: "market", label: "Market pressure", value: `${state.market?.demandIndex ?? 100}`, description: state.market?.trend ?? "stable" },
    { id: "demand", label: "Demand", value: `${state.market?.demandIndex ?? 100}` },
    { id: "revenue", label: "Revenue", value: money(state.business.revenue) },
    { id: "costs", label: "Expenses", value: money(state.business.expenses) },
    { id: "profit", label: "Profit", value: money(kpis.profit) },
  ];
  return <div className="ev-intelligence-layer">
    <Surface className="ev-intelligence-hero"><SectionHeader eyebrow="ENTERPRISE INTELLIGENCE" title="Understand the system before you act." description="Wave 2 connects the cockpit to live simulation state: attention, causality, scenarios, decisions, notifications and search." /><IntelligenceSearch onSearch={() => undefined} /></Surface>
    <AttentionQueue signals={signals} onOpen={onAttention} />
    <CausalChain nodes={causalNodes} />
    <ScenarioCompare baseline={baseline} scenarios={scenarios} onSelect={onScenario} />
    <DecisionTimeline events={decisions} onOpen={onDecision} />
    <NotificationCenter notifications={signals.slice(0, 5).map((signal) => ({ id: signal.id, title: signal.title, body: signal.reason, unread: signal.priority === "critical" || signal.priority === "high" }))} />
  </div>;
}
