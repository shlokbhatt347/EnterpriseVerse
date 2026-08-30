import type { SimulationState } from "@enterpriseverse/types";
import { calculatePhase4Health, calculatePhase4MarketPulse, buildPhase4Attention } from "./phase4";

export type Phase4Confidence = "known" | "estimated" | "uncertain";

export interface Phase4Metric<T extends number | string = number> {
  value: T;
  confidence: Phase4Confidence;
  source: string;
}

export interface Phase4BusinessProjection {
  id: string; name: string; industry: string; day: number;
  status: SimulationState["business"]["status"];
  cash: Phase4Metric; revenue: Phase4Metric; expenses: Phase4Metric;
  inventory: Phase4Metric; reputation: Phase4Metric; marketShare: Phase4Metric; valuation: Phase4Metric;
}

export interface Phase4WorldProjection {
  economy: ReturnType<typeof calculatePhase4MarketPulse>["economy"];
  demand: Phase4Metric; confidence: Phase4Metric; competitivePressure: Phase4Metric;
  priceIndex: Phase4Metric; trend: ReturnType<typeof calculatePhase4MarketPulse>["trend"];
}

export interface Phase4CustomerProjection {
  count: number; averageTrust: number; satisfaction: number; acquisition: number; churnSignal: number; confidence: Phase4Confidence;
}

export interface Phase4OperationsProjection {
  capacity: number; inventory: number; stockoutDays: number; quality: number; workforceHealth: number; confidence: Phase4Confidence;
}

export interface Phase4FinanceProjection {
  cash: number; debt: number; runwayDays: number; profit: number; valuation: number; confidence: Phase4Confidence;
}

export interface Phase4CompetitorProjection {
  name: string; strategy: string; marketShare: number; aggression: number; confidence: Phase4Confidence;
}

export interface Phase4CauseProjection { id: string; day: number; title: string; message: string; confidence: Phase4Confidence; }

export interface Phase4StateProjection {
  version: 1; day: number; business: Phase4BusinessProjection; world: Phase4WorldProjection;
  customers: Phase4CustomerProjection; operations: Phase4OperationsProjection; finance: Phase4FinanceProjection;
  workforce: { morale: number; productivity: number; retention: number; confidence: Phase4Confidence };
  competitors: Phase4CompetitorProjection[]; attention: ReturnType<typeof buildPhase4Attention>; causes: Phase4CauseProjection[];
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value * 10) / 10;
const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;
const metric = (value: number, confidence: Phase4Confidence, source: string): Phase4Metric => ({ value: round(finite(value)), confidence, source });

function inferValuation(state: SimulationState): number {
  const explicit = state.financials?.valuation;
  if (typeof explicit === "number" && Number.isFinite(explicit)) return Math.max(0, explicit);
  const revenue = Math.max(0, state.business.revenue);
  const cash = Math.max(0, state.business.cash);
  const debt = Math.max(0, state.operations?.debt ?? state.financials?.debt ?? 0);
  return Math.max(0, revenue * 2 + cash - debt);
}

export function projectPhase4State(state: SimulationState): Phase4StateProjection {
  const market = calculatePhase4MarketPulse(state);
  const health = calculatePhase4Health(state);
  const operations = state.operations;
  const workforce = state.workforce;
  const customers = state.business.customers;
  const debt = Math.max(0, operations?.debt ?? state.financials?.debt ?? 0);
  const valuation = inferValuation(state);
  const customerTrust = customers.length ? customers.reduce((sum, customer) => sum + customer.trust, 0) / customers.length : 50;
  const acquisition = state.market?.customerAcquisition ?? 0;
  const stockoutDays = state.economy?.supplyChain?.stockoutDays ?? 0;
  const causes = (state.events ?? []).slice(0, 8).map((event) => ({ id: event.id, day: event.day, title: event.title, message: event.message, confidence: "known" as const }));
  return {
    version: 1, day: state.business.day,
    business: {
      id: state.business.id, name: state.business.name, industry: state.business.industry, day: state.business.day, status: state.business.status,
      cash: metric(state.business.cash, "known", "business.cash"), revenue: metric(state.business.revenue, "known", "business.revenue"),
      expenses: metric(state.business.expenses, "known", "business.expenses"), inventory: metric(state.business.inventory, "known", "business.inventory"),
      reputation: metric(state.business.reputation, "known", "business.reputation"), marketShare: metric(state.business.marketShare, "known", "business.marketShare"),
      valuation: metric(valuation, state.financials?.valuation === undefined ? "estimated" : "known", "financials.valuation"),
    },
    world: {
      economy: market.economy, demand: metric(market.demand, "estimated", "market.demand"), confidence: metric(market.confidence, "estimated", "market.confidence"),
      competitivePressure: metric(market.competitivePressure, "estimated", "market.competitivePressure"), priceIndex: metric(market.priceIndex, "estimated", "market.marketPrice"), trend: market.trend,
    },
    customers: { count: customers.length, averageTrust: round(clamp(customerTrust)), satisfaction: round(clamp(operations?.customerSatisfaction ?? 50)), acquisition: round(Math.max(0, acquisition)), churnSignal: round(clamp(100 - health.customers)), confidence: "estimated" },
    operations: { capacity: round(clamp(operations?.productionCapacity ?? 0, 0, 10000)), inventory: round(Math.max(0, state.business.inventory)), stockoutDays: Math.max(0, stockoutDays), quality: round(clamp(operations?.quality ?? 60)), workforceHealth: health.workforce, confidence: "estimated" },
    finance: { cash: round(Math.max(0, state.business.cash)), debt: round(debt), runwayDays: Math.max(0, Math.round(state.financials?.runwayDays ?? 0)), profit: round(state.business.revenue - state.business.expenses), valuation: round(valuation), confidence: "known" },
    workforce: { morale: round(clamp(workforce?.moraleIndex ?? 65)), productivity: round(clamp(workforce?.productivityIndex ?? 65)), retention: round(clamp(100 - (workforce?.turnoverRisk ?? 25))), confidence: "estimated" },
    competitors: [...(state.agents?.competitors ?? [])].sort((a, b) => b.marketShare - a.marketShare).slice(0, 10).map((competitor) => ({ name: competitor.name, strategy: competitor.strategy, marketShare: round(clamp(competitor.marketShare)), aggression: round(clamp(competitor.aggression)), confidence: "estimated" })),
    attention: buildPhase4Attention(state), causes,
  };
}

export function projectPhase4History(states: SimulationState[]): Phase4StateProjection[] { return states.map(projectPhase4State); }
