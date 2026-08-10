import type { CompetitorAgent, SimulationState } from "@enterpriseverse/types";
import { createCompetitorProfile19, decideCompetitor19, evolveLivingMarket19, type CompetitorDecision19, type LivingMarket19, type Personality19 } from "./phase19";

export type WorldEventCategory20 = "macro" | "market" | "supply" | "competitor" | "customer" | "reputation" | "opportunity";
export type WorldEventSeverity20 = "low" | "medium" | "high" | "critical";
export type WorldDecision20 = "hold" | "respond" | "invest" | "differentiate" | "protect_cash";

export interface WorldEvent20 {
  id: string;
  day: number;
  category: WorldEventCategory20;
  severity: WorldEventSeverity20;
  title: string;
  description: string;
  durationDays: number;
  effects: Record<string, number>;
  tags: string[];
}

export interface WorldMemory20 {
  id: string;
  entityId: string;
  day: number;
  topic: string;
  summary: string;
  sentiment: number;
  strength: number;
}

export interface CauseEffect20 {
  id: string;
  source: string;
  sourceType: "player" | "competitor" | "event" | "market";
  day: number;
  observedDay: number;
  delayDays: number;
  effects: Record<string, number>;
  explanation: string;
  confidence: number;
}

export interface WorldSnapshot20 {
  day: number;
  market: LivingMarket19;
  competitorDecisions: CompetitorDecision19[];
  player: { cash: number; revenue: number; profit: number; reputation: number; marketShare: number; customers: number };
  activeEvents: string[];
  memoryCount: number;
  worldPressure: number;
  signature: string;
}

export interface LivingWorldState20 {
  seed: number;
  market: LivingMarket19;
  competitors: Personality19[];
  competitorAgents: CompetitorAgent[];
  events: WorldEvent20[];
  memories: WorldMemory20[];
  causes: CauseEffect20[];
  snapshots: WorldSnapshot20[];
  decisions: string[];
}

export interface ReplayComparison20 {
  fromDay: number;
  toDay: number;
  cashDelta: number;
  revenueDelta: number;
  profitDelta: number;
  reputationDelta: number;
  marketShareDelta: number;
  customerDelta: number;
  marketDemandDelta: number;
  pressureDelta: number;
}

export interface ReplaySummary20 {
  days: number;
  decisions: number;
  events: number;
  memories: number;
  averagePressure: number;
  finalCash: number;
  finalRevenue: number;
  finalProfit: number;
  finalReputation: number;
  finalMarketShare: number;
  finalDemand: number;
  signature: string;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value * 100) / 100;

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  return h >>> 0;
}

function random01(seed: number, salt: number): number {
  let x = (seed ^ Math.imul(salt + 1, 0x9e3779b9)) >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return ((x >>> 0) % 1000003) / 1000003;
}

function severity(value: number): WorldEventSeverity20 {
  if (value >= 82) return "critical";
  if (value >= 62) return "high";
  if (value >= 38) return "medium";
  return "low";
}

function categoryFor(seed: number, day: number, market: LivingMarket19): WorldEventCategory20 {
  if (market.supplyReliability < 55) return "supply";
  if (market.consumerConfidence < 45) return "macro";
  const categories: WorldEventCategory20[] = ["market", "competitor", "customer", "reputation", "opportunity", "macro"];
  return categories[Math.floor(random01(seed, day * 43) * categories.length)];
}

export function generateWorldEvent20(seed: number, day: number, market: LivingMarket19): WorldEvent20 | null {
  const roll = random01(seed, day * 47);
  if (roll < 0.42) return null;
  const category = categoryFor(seed, day, market);
  const pressure = clamp(20 + Math.abs(market.demandIndex - 100) * 0.8 + market.eventPressure * 0.6);
  const templates: Record<WorldEventCategory20, { title: string; description: string; effects: Record<string, number>; tags: string[] }> = {
    macro: { title: "Consumer confidence shifts", description: market.consumerConfidence < 55 ? "Consumers are becoming cautious. Price and trust matter more than usual." : "Confidence is strengthening. Customers are more willing to try new offers.", effects: { demand: market.consumerConfidence < 55 ? -8 : 7, confidence: market.consumerConfidence < 55 ? -6 : 5 }, tags: ["macro", "demand"] },
    market: { title: "Market window opens", description: "A change in market conditions creates a short-lived opening for a well-positioned business.", effects: { demand: 6, opportunity: 12 }, tags: ["market", "opportunity"] },
    supply: { title: "Supply chain friction", description: "Input availability is becoming less reliable. Inventory discipline is now more valuable.", effects: { supply: -12, costs: 7 }, tags: ["supply", "operations"] },
    competitor: { title: "Competitor escalation", description: "A competitor is preparing a stronger move. Standing still may cost share.", effects: { competition: 12, marketSharePressure: 7 }, tags: ["competitor", "strategy"] },
    customer: { title: "Customer preferences move", description: "A visible customer trend is changing what buyers value.", effects: { innovationDemand: 8, satisfactionPressure: 5 }, tags: ["customer", "product"] },
    reputation: { title: "Reputation moment", description: "The market is paying closer attention to how businesses behave and communicate.", effects: { reputationPressure: 10, trustImportance: 8 }, tags: ["reputation", "trust"] },
    opportunity: { title: "Strategic partnership opportunity", description: "A potential partner could accelerate growth, but the opportunity requires focused execution.", effects: { opportunity: 18, executionPressure: 7 }, tags: ["opportunity", "growth"] },
  };
  const template = templates[category];
  return { id: `world-event-${day}-${hash(`${seed}:${day}:${category}`)}`, day, category, severity(pressure), title: template.title, description: template.description, durationDays: 2 + Math.floor(random01(seed, day * 53) * 5), effects: template.effects, tags: template.tags };
}

export function createLivingWorld20(seedInput: number | string, competitorCount = 8): LivingWorldState20 {
  const seed = typeof seedInput === "number" ? Math.abs(Math.floor(seedInput)) >>> 0 : hash(seedInput);
  const safeCount = Math.max(1, Math.min(20, Math.floor(competitorCount)));
  const market: LivingMarket19 = { day: 0, trend: "stable", demandIndex: 100, marketPrice: 100, pricePressure: 50, innovationDemand: 50, consumerConfidence: 70, supplyReliability: 80, inflation: 3, eventPressure: 20 };
  const competitors = Array.from({ length: safeCount }, (_, index) => createCompetitorProfile19(seed, index));
  return { seed, market, competitors, competitorAgents: [], events: [], memories: [], causes: [], snapshots: [], decisions: [] };
}

export function recordWorldMemory20(state: LivingWorldState20, memory: Omit<WorldMemory20, "id">): LivingWorldState20 {
  const id = `memory-${memory.entityId}-${memory.day}-${hash(`${memory.entityId}:${memory.day}:${memory.summary}`)}`;
  const next = [...state.memories, { ...memory, id }].sort((a, b) => a.day - b.day || a.id.localeCompare(b.id));
  return { ...state, memories: next.slice(-500) };
}

export function registerCauseEffect20(state: LivingWorldState20, cause: Omit<CauseEffect20, "id">): LivingWorldState20 {
  const id = `cause-${cause.day}-${cause.sourceType}-${hash(`${cause.source}:${cause.observedDay}:${JSON.stringify(cause.effects)}`)}`;
  return { ...state, causes: [...state.causes, { ...cause, id }].slice(-500) };
}

function eventPressure(events: WorldEvent20[]): number {
  return round(events.reduce((total, event) => total + ({ low: 12, medium: 28, high: 52, critical: 80 }[event.severity]), 0));
}

export function advanceLivingWorld20(input: { state: LivingWorldState20; simulation: SimulationState; day: number; decision?: { id: string; label: string; effects?: Record<string, number> } }): LivingWorldState20 {
  const previous = input.state.market;
  const market = evolveLivingMarket19({ seed: input.state.seed, day: input.day, previous, competitorStrength: input.simulation.market?.competitivePressure, playerReputation: input.simulation.business.reputation, supplyReliability: input.simulation.market?.confidence });
  const event = generateWorldEvent20(input.state.seed, input.day, market);
  const retainedEvents = input.state.events.filter((item) => input.day - item.day < item.durationDays);
  const events = event ? [...retainedEvents, event] : retainedEvents;
  const memoryCountByCompetitor = (id: string) => input.state.memories.filter((memory) => memory.entityId === id).length;
  const competitorDecisions = input.state.competitors.map((profile) => decideCompetitor19(profile, market, input.simulation, memoryCountByCompetitor(profile.id), input.day));
  let next: LivingWorldState20 = { ...input.state, market, events, decisions: input.decision ? [...input.state.decisions, `${input.day}:${input.decision.id}`].slice(-500) : input.state.decisions };
  for (const decision of competitorDecisions) {
    next = recordWorldMemory20(next, { entityId: decision.competitorId, day: input.day, topic: "strategy", summary: decision.rationale, sentiment: decision.action === "hold" ? 5 : -8, strength: clamp(35 + decision.intensity * 0.5) });
    next = registerCauseEffect20(next, { source: decision.competitorId, sourceType: "competitor", day: input.day, observedDay: input.day, delayDays: 0, effects: { marketPressure: decision.intensity, marketSharePressure: decision.expectedMarketShareDelta }, explanation: `${decision.rationale} This changes the competitive pressure facing the business.`, confidence: 70 });
  }
  if (event) {
    next = recordWorldMemory20(next, { entityId: "market", day: input.day, topic: event.category, summary: event.title, sentiment: event.severity === "critical" || event.severity === "high" ? -18 : 8, strength: ({ low: 25, medium: 45, high: 70, critical: 90 }[event.severity]) });
    next = registerCauseEffect20(next, { source: event.id, sourceType: "event", day: input.day, observedDay: input.day + event.durationDays, delayDays: event.durationDays, effects: event.effects, explanation: `${event.title} persists for ${event.durationDays} days, so its strategic effect can outlast the moment it appears.`, confidence: 82 });
  }
  if (input.decision) {
    const effects = input.decision.effects ?? {};
    next = recordWorldMemory20(next, { entityId: "player", day: input.day, topic: "decision", summary: input.decision.label, sentiment: (effects.reputation ?? 0) - (effects.cash ?? 0) / 5000, strength: clamp(40 + Object.keys(effects).length * 8) });
    next = registerCauseEffect20(next, { source: input.decision.id, sourceType: "player", day: input.day, observedDay: input.day + 1, delayDays: 1, effects, explanation: `The decision “${input.decision.label}” creates effects that may become visible after the immediate action.`, confidence: 75 });
  }
  const pressure = clamp(market.pricePressure + eventPressure(events) * 0.25 + competitorDecisions.reduce((sum, item) => sum + item.intensity, 0) / Math.max(1, competitorDecisions.length) * 0.35);
  const profit = input.simulation.financials?.netProfit ?? input.simulation.business.revenue - input.simulation.business.expenses;
  const signature = `${input.state.seed}:${input.day}:${market.trend}:${Math.round(market.demandIndex)}:${Math.round(pressure)}:${competitorDecisions.map((d) => `${d.competitorId}:${d.action}:${Math.round(d.intensity)}`).join(",")}:${events.map((e) => e.id).join(",")}`;
  const snapshot: WorldSnapshot20 = { day: input.day, market, competitorDecisions, player: { cash: round(input.simulation.business.cash), revenue: round(input.simulation.business.revenue), profit: round(profit), reputation: round(input.simulation.business.reputation), marketShare: round(input.simulation.business.marketShare), customers: input.simulation.business.customers.length }, activeEvents: events.map((item) => item.id), memoryCount: next.memories.length, worldPressure: round(pressure), signature };
  return { ...next, competitorAgents: next.competitorAgents.length ? next.competitorAgents : [], snapshots: [...next.snapshots, snapshot].slice(-365) };
}

export function compareWorldSnapshots20(a: WorldSnapshot20, b: WorldSnapshot20): ReplayComparison20 {
  return { fromDay: a.day, toDay: b.day, cashDelta: round(b.player.cash - a.player.cash), revenueDelta: round(b.player.revenue - a.player.revenue), profitDelta: round(b.player.profit - a.player.profit), reputationDelta: round(b.player.reputation - a.player.reputation), marketShareDelta: round(b.player.marketShare - a.player.marketShare), customerDelta: b.player.customers - a.player.customers, marketDemandDelta: round(b.market.demandIndex - a.market.demandIndex), pressureDelta: round(b.worldPressure - a.worldPressure) };
}

export function compareReplayRuns20(a: LivingWorldState20, b: LivingWorldState20): ReplayComparison20 | null {
  const firstA = a.snapshots[0]; const lastA = a.snapshots[a.snapshots.length - 1]; const firstB = b.snapshots[0]; const lastB = b.snapshots[b.snapshots.length - 1];
  if (!firstA || !lastA || !firstB || !lastB) return null;
  return { fromDay: Math.min(firstA.day, firstB.day), toDay: Math.max(lastA.day, lastB.day), cashDelta: round((lastB.player.cash - firstB.player.cash) - (lastA.player.cash - firstA.player.cash)), revenueDelta: round((lastB.player.revenue - firstB.player.revenue) - (lastA.player.revenue - firstA.player.revenue)), profitDelta: round((lastB.player.profit - firstB.player.profit) - (lastA.player.profit - firstA.player.profit)), reputationDelta: round((lastB.player.reputation - firstB.player.reputation) - (lastA.player.reputation - firstA.player.reputation)), marketShareDelta: round((lastB.player.marketShare - firstB.player.marketShare) - (lastA.player.marketShare - firstA.player.marketShare)), customerDelta: (lastB.player.customers - firstB.player.customers) - (lastA.player.customers - firstA.player.customers), marketDemandDelta: round((lastB.market.demandIndex - firstB.market.demandIndex) - (lastA.market.demandIndex - firstA.market.demandIndex)), pressureDelta: round((lastB.worldPressure - firstB.worldPressure) - (lastA.worldPressure - firstA.worldPressure)) };
}

export function summarizeLivingWorld20(state: LivingWorldState20): ReplaySummary20 {
  const snapshots = state.snapshots; const last = snapshots[snapshots.length - 1];
  const averagePressure = snapshots.length ? round(snapshots.reduce((sum, snapshot) => sum + snapshot.worldPressure, 0) / snapshots.length) : 0;
  return { days: snapshots.length, decisions: state.decisions.length, events: state.events.length, memories: state.memories.length, averagePressure, finalCash: last?.player.cash ?? 0, finalRevenue: last?.player.revenue ?? 0, finalProfit: last?.player.profit ?? 0, finalReputation: last?.player.reputation ?? 0, finalMarketShare: last?.player.marketShare ?? 0, finalDemand: last?.market.demandIndex ?? state.market.demandIndex, signature: last?.signature ?? `${state.seed}:empty` };
}
