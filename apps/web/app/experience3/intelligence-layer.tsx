'use client';

import { useMemo, useState } from "react";
import type { SimulationState } from "@enterpriseverse/types";
import { buildAttentionSignals, buildCausalChain, buildDecisionMemory, buildNotifications, compareWave2Scenario, searchEnterprise, calculateKpis } from "@enterpriseverse/simulation";
import { AttentionQueue, CausalChain, DecisionTimeline, IntelligenceSearch, NotificationCenter, ScenarioCompare } from "./core-intelligence";
import { SectionHeader, Surface } from "./design-system";

const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

type Signal = ReturnType<typeof buildAttentionSignals>[number];
type Decision = ReturnType<typeof buildDecisionMemory>[number];

export function IntelligenceLayer({ state, onAttention, onDecision, onScenario }: { state: SimulationState; onAttention?: (signal: Signal) => void; onDecision?: (event: Decision) => void; onScenario?: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const signals = useMemo(() => buildAttentionSignals(state), [state]);
  const decisions = useMemo(() => buildDecisionMemory(state), [state]);
  const notifications = useMemo(() => buildNotifications(state), [state]);
  const searchResults = useMemo(() => searchEnterprise(state, query), [state, query]);
  const kpis = useMemo(() => calculateKpis(state), [state]);
  const baseline = [
    { label: "Cash", value: money(state.business.cash) },
    { label: "Revenue", value: money(state.business.revenue) },
    { label: "Share", value: `${state.business.marketShare.toFixed(1)}%` },
  ];
  const scenarioInputs = [
    { id: "price-up", name: "Raise price", input: { priceDeltaPct: 8 } },
    { id: "quality-up", name: "Invest in quality", input: { qualityInvestment: 1000 } },
    { id: "marketing", name: "Increase marketing", input: { marketingBudget: 2000 } },
  ];
  const scenarios = scenarioInputs.map((scenario) => { const result = compareWave2Scenario(state, scenario.input); return { id: scenario.id, name: scenario.name, values: [money(result.projected.cash), money(result.projected.revenue), `${result.projected.marketShare.toFixed(1)}%`], delta: result.warnings[0] ?? `${result.confidence} confidence` }; });
  const causalNodes = buildCausalChain(state, kpis.cashRunwayDays < 30 ? "cash" : "revenue");
  return <div className="ev-intelligence-layer">
    <Surface className="ev-intelligence-hero"><SectionHeader eyebrow="ENTERPRISE INTELLIGENCE" title="Understand the system before you act." description="Wave 2 is driven by live simulation state: ranked attention, causal context, safe scenarios, decision memory, notifications and enterprise search." /><IntelligenceSearch onSearch={setQuery} /></Surface>
    {query && <Surface className="ev-search-results"><SectionHeader eyebrow="SEARCH" title={`${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`} description="Ranked across business, customers, suppliers, events, decisions and metrics." />{searchResults.map((result) => <button type="button" className="ev-search-result" key={`${result.type}-${result.id}`}><b>{result.title}</b><small>{result.type.toUpperCase()} · {result.detail}</small></button>)}</Surface>}
    <AttentionQueue signals={signals} onOpen={onAttention} />
    <CausalChain nodes={causalNodes} />
    <ScenarioCompare baseline={baseline} scenarios={scenarios} onSelect={onScenario} />
    <DecisionTimeline events={decisions} onOpen={onDecision} />
    <NotificationCenter notifications={notifications} />
  </div>;
}
