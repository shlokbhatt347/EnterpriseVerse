import type { AgentDecision, CompetitorAgent, SimulationChoice, SimulationEvent, SimulationState } from "@enterpriseverse/types";
import { advanceDay, applyChoice } from "./index";

export interface LivingWorldSummary {
  economy: "boom" | "stable" | "slowdown";
  demand: number;
  confidence: number;
  competitivePressure: number;
  activeScenarios: string[];
  competitorLeaders: Array<{ name: string; marketShare: number; strategy: CompetitorAgent["strategy"] }>;
  latestReactions: AgentDecision[];
}
export interface NegotiationResult { accepted: boolean; title: string; message: string; choice: SimulationChoice; }
const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export function getLivingWorldSummary(state: SimulationState): LivingWorldSummary {
  const market = state.market; const demand = clamp(market?.demandIndex ?? 50); const confidence = clamp(market?.confidence ?? 50); const pressure = clamp(market?.competitivePressure ?? 25);
  const economy = demand >= 65 && confidence >= 60 ? "boom" : demand <= 35 || confidence <= 40 ? "slowdown" : "stable";
  const competitors = [...(state.agents?.competitors ?? [])].sort((a, b) => b.marketShare - a.marketShare).slice(0, 3);
  return { economy, demand, confidence, competitivePressure: pressure, activeScenarios: (state.scenarios?.active ?? []).map((scenario) => scenario.title), competitorLeaders: competitors.map((c) => ({ name: c.name, marketShare: c.marketShare, strategy: c.strategy })), latestReactions: (state.agents?.lastDecisions ?? []).slice(-6) };
}

export function buildLivingWorldEvent(state: SimulationState): SimulationEvent | null {
  const day = state.business.day; const market = state.market; const competitor = [...(state.agents?.competitors ?? [])].sort((a, b) => b.aggression - a.aggression)[0];
  if (market && market.competitivePressure >= 65 && competitor) return { id: `world-competition-${day}`, day, title: `${competitor.name} is attacking your market`, message: `${competitor.name} is using an aggressive ${competitor.strategy} strategy. You can defend your position, differentiate, or conserve cash.`, choices: [
    { id: "defend-market", label: "Defend market share", effects: { cash: -700, revenue: 1600, marketShare: 1.2, reputation: 1 } },
    { id: "differentiate-world", label: "Differentiate on quality", effects: { cash: -450, revenue: 1200, marketShare: 0.8, reputation: 3 } },
    { id: "conserve-cash", label: "Conserve cash", effects: { cash: 150, revenue: 350, marketShare: -0.3 } },
  ] };
  const scenario = state.scenarios?.active[0];
  if (scenario?.category === "supply") return { id: `world-supply-${day}`, day, title: "Supply chain under pressure", message: `${scenario.title} is active. Your next procurement decision can protect inventory or protect cash.`, choices: [
    { id: "secure-stock", label: "Secure critical stock", effects: { cash: -900, inventory: 18, reputation: 1 } },
    { id: "dual-source", label: "Use a second supplier", effects: { cash: -500, inventory: 10, supplierRelationship: 3 } },
    { id: "wait-it-out", label: "Wait and protect cash", effects: { cash: 100, inventory: -6, reputation: -1 } },
  ] };
  if (market && market.confidence <= 40) return { id: `world-slowdown-${day}`, day, title: "Customers are becoming cautious", message: "Consumer confidence is falling. Choose whether to protect margins, stimulate demand, or preserve cash.", choices: [
    { id: "value-offer", label: "Launch a targeted value offer", effects: { cash: -450, revenue: 1200, customers: 4, reputation: 1 } },
    { id: "protect-margin", label: "Protect your margin", effects: { revenue: 500, reputation: 1, customers: -1 } },
    { id: "cut-spend", label: "Cut discretionary spending", effects: { cash: 650, reputation: -1 } },
  ] };
  return null;
}

export function negotiateWithSupplier(state: SimulationState, supplierId?: string): NegotiationResult {
  const supplier = state.agents?.suppliers.find((item) => item.id === supplierId) ?? state.agents?.suppliers[0];
  if (!supplier) return { accepted: false, title: "No supplier available", message: "There is no active supplier agent to negotiate with.", choice: { id: "none", label: "Close", effects: {} } };
  const flexibility = clamp(supplier.negotiationFlexibility); const discount = Math.round(2 + flexibility * 0.08); const accepted = flexibility >= 35;
  const choice: SimulationChoice = accepted ? { id: `supplier-negotiate-${supplier.id}`, label: `Negotiate ${discount}% lower cost`, effects: { cash: 0, supplierRelationship: 4, supplierCostReduction: discount } } : { id: `supplier-trust-${supplier.id}`, label: "Build the relationship first", effects: { supplierRelationship: 6, reputation: 1 } };
  return { accepted, title: accepted ? "Supplier negotiation opportunity" : "Supplier needs more trust", message: accepted ? `${supplier.name} has room to negotiate because your relationship and their flexibility are strong.` : `${supplier.name} is not ready for a major price concession. Strengthen the relationship before pushing on price.`, choice };
}

export function resolveLivingWorldChoice(state: SimulationState, choice: SimulationChoice): SimulationState { const resolved = applyChoice(state, choice); return { ...resolved, log: [...resolved.log, `Day ${state.business.day}: ${choice.label} changed the living market around ${state.business.name}.`] }; }

export function advanceLivingWorldDay(state: SimulationState): SimulationState {
  const next = advanceDay(state); const event = buildLivingWorldEvent(next); const summary = getLivingWorldSummary(next);
  const worldLog = [`World: ${summary.economy} economy, demand ${Math.round(summary.demand)}/100, confidence ${Math.round(summary.confidence)}/100, competitive pressure ${Math.round(summary.competitivePressure)}/100.`, ...(summary.activeScenarios.length ? [`Active scenario: ${summary.activeScenarios.join(", ")}.`] : [])];
  return { ...next, events: event ? [event, ...next.events].slice(0, 3) : next.events, log: [...next.log, ...worldLog] };
}
