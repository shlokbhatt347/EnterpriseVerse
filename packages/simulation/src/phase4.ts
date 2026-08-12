import type { SimulationChoice, SimulationState } from "@enterpriseverse/types";
import { applyChoice } from "./index";
import { advanceLivingWorldDay, getLivingWorldSummary } from "./phase26";

export type Phase4Severity = "info" | "watch" | "critical";

export interface Phase4MarketPulse {
  economy: "boom" | "stable" | "slowdown";
  demand: number;
  confidence: number;
  competitivePressure: number;
  priceIndex: number;
  customerAcquisition: number;
  trend: "growing" | "stable" | "declining";
}

export interface Phase4Health {
  financial: number;
  customers: number;
  operations: number;
  workforce: number;
  reputation: number;
  innovation: number;
  overall: number;
  risk: number;
}

export interface Phase4AttentionItem {
  id: string;
  severity: Phase4Severity;
  title: string;
  reason: string;
  metric?: string;
  action: string;
}

export interface Phase4DecisionPreview {
  choiceId: string;
  label: string;
  projected: {
    cashDelta: number;
    revenueDelta: number;
    reputationDelta: number;
    marketShareDelta: number;
    healthDelta: number;
    riskDelta: number;
  };
}

export interface Phase4ExecutiveBriefing {
  headline: string;
  situation: string;
  why: string;
  priorities: Array<{ title: string; detail: string }>;
  attention: Phase4AttentionItem[];
  market: Phase4MarketPulse;
  health: Phase4Health;
}

export interface Phase4CommandCenter {
  briefing: Phase4ExecutiveBriefing;
  previews: Phase4DecisionPreview[];
  recentEvents: Array<{ title: string; message: string; day: number }>;
  competitors: Array<{ name: string; strategy: string; marketShare: number; aggression: number }>;
  activeScenarios: string[];
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value * 10) / 10;
const delta = (before: number, after: number) => round(after - before);

function normalizeFinancialHealth(state: SimulationState): number {
  const cash = Math.max(0, state.business.cash);
  const debt = Math.max(0, state.operations?.debt ?? state.financials?.debt ?? 0);
  const runway = Math.max(0, state.financials?.runwayDays ?? 0);
  const cashScore = clamp(cash / 2000);
  const debtScore = 100 - clamp((debt / Math.max(1, cash + debt)) * 100);
  const runwayScore = clamp(runway / 90 * 100);
  return round(clamp(cashScore * 0.35 + debtScore * 0.35 + runwayScore * 0.3));
}

export function calculatePhase4MarketPulse(state: SimulationState): Phase4MarketPulse {
  const world = getLivingWorldSummary(state);
  const market = state.market;
  return {
    economy: world.economy,
    demand: round(world.demand),
    confidence: round(world.confidence),
    competitivePressure: round(world.competitivePressure),
    priceIndex: round(market?.marketPrice ?? state.operations?.price ?? 100),
    customerAcquisition: round(market?.customerAcquisition ?? 0),
    trend: market?.trend ?? "stable",
  };
}

export function calculatePhase4Health(state: SimulationState): Phase4Health {
  const operations = state.operations;
  const workforce = state.workforce;
  const market = state.market;
  const financial = normalizeFinancialHealth(state);
  const customerTrust = state.business.customers.length
    ? state.business.customers.reduce((sum, customer) => sum + customer.trust, 0) / state.business.customers.length
    : 50;
  const satisfaction = operations?.customerSatisfaction ?? 50;
  const customers = clamp(customerTrust * 0.55 + satisfaction * 0.45);
  const inventory = state.business.inventory;
  const supplyRisk = state.economy?.supplyChain?.stockoutDays ?? 0;
  const operationsHealth = clamp(65 + inventory * 0.3 - supplyRisk * 7 + (operations?.quality ?? 60) * 0.25);
  const workforceHealth = clamp((workforce?.moraleIndex ?? 65) * 0.55 + (workforce?.productivityIndex ?? 65) * 0.45);
  const reputation = clamp(state.business.reputation);
  const innovation = clamp(operations?.quality ?? 60 + (market?.strategyScore ?? 50) * 0.35);
  const risk = clamp(
    100 - (
      financial * 0.3 +
      customers * 0.15 +
      operationsHealth * 0.15 +
      workforceHealth * 0.15 +
      reputation * 0.1 +
      innovation * 0.15
    ),
  );
  const overall = clamp(
    financial * 0.25 +
    customers * 0.15 +
    operationsHealth * 0.15 +
    workforceHealth * 0.15 +
    reputation * 0.1 +
    innovation * 0.1 +
    (100 - risk) * 0.1,
  );
  return {
    financial: round(financial),
    customers: round(customers),
    operations: round(operationsHealth),
    workforce: round(workforceHealth),
    reputation: round(reputation),
    innovation: round(innovation),
    overall: round(overall),
    risk: round(risk),
  };
}

export function buildPhase4Attention(state: SimulationState): Phase4AttentionItem[] {
  const market = calculatePhase4MarketPulse(state);
  const health = calculatePhase4Health(state);
  const items: Phase4AttentionItem[] = [];

  if (state.business.cash <= 2500 || health.financial < 35) {
    items.push({ id: "cash-risk", severity: "critical", title: "Cash position needs protection", reason: "Your available cash or financial health is entering a fragile range.", metric: `₹${Math.round(state.business.cash).toLocaleString("en-IN")}`, action: "Review cash and funding decisions." });
  } else if (health.financial < 55) {
    items.push({ id: "cash-watch", severity: "watch", title: "Cash position is tightening", reason: "Financial headroom is shrinking; avoid unnecessary commitments.", metric: `₹${Math.round(state.business.cash).toLocaleString("en-IN")}`, action: "Protect liquidity." });
  }

  if (market.competitivePressure >= 70) {
    items.push({ id: "competition", severity: "critical", title: "Competitive pressure is high", reason: "Competitor behavior is actively threatening market position.", metric: `${Math.round(market.competitivePressure)}/100`, action: "Review differentiation or market defense." });
  } else if (market.competitivePressure >= 55) {
    items.push({ id: "competition-watch", severity: "watch", title: "Competitors are becoming more aggressive", reason: "Market pressure is rising above the normal operating range.", metric: `${Math.round(market.competitivePressure)}/100`, action: "Monitor competitor moves." });
  }

  if (market.confidence <= 40) {
    items.push({ id: "demand", severity: "critical", title: "Customer confidence is weakening", reason: "Demand conditions are becoming less predictable.", metric: `${Math.round(market.confidence)}/100`, action: "Protect demand and customer trust." });
  }

  const stockoutDays = state.economy?.supplyChain?.stockoutDays ?? 0;
  if (stockoutDays >= 2) {
    items.push({ id: "supply", severity: "critical", title: "Supply chain is constraining sales", reason: "Stockout days indicate demand is being lost because supply cannot keep up.", metric: `${stockoutDays} stockout days`, action: "Secure supply or adjust demand." });
  }

  if (health.workforce < 45) {
    items.push({ id: "workforce", severity: "critical", title: "Workforce strain is affecting execution", reason: "Morale/productivity is low enough to threaten reliable delivery.", metric: `${Math.round(health.workforce)}/100`, action: "Review workload and people decisions." });
  } else if (health.workforce < 60) {
    items.push({ id: "workforce-watch", severity: "watch", title: "Workforce health needs attention", reason: "Productivity or morale is drifting down.", metric: `${Math.round(health.workforce)}/100`, action: "Review people capacity." });
  }

  if (health.reputation < 40) {
    items.push({ id: "reputation", severity: "critical", title: "Reputation is under pressure", reason: "Customer trust and external confidence can reduce future demand.", metric: `${Math.round(health.reputation)}/100`, action: "Protect customer experience." });
  }

  items.sort((a, b) => ({ critical: 0, watch: 1, info: 2 }[a.severity] - { critical: 0, watch: 1, info: 2 }[b.severity]));
  return items.slice(0, 6);
}

export function previewPhase4Decision(state: SimulationState, choice: SimulationChoice): Phase4DecisionPreview {
  const before = calculatePhase4Health(state);
  const projectedState = applyChoice(state, choice);
  const after = calculatePhase4Health(projectedState);
  return {
    choiceId: choice.id,
    label: choice.label,
    projected: {
      cashDelta: round(choice.effects.cash ?? 0),
      revenueDelta: round(choice.effects.revenue ?? 0),
      reputationDelta: round(choice.effects.reputation ?? 0),
      marketShareDelta: round(choice.effects.marketShare ?? 0),
      healthDelta: delta(before.overall, after.overall),
      riskDelta: delta(before.risk, after.risk),
    },
  };
}

function firstPriority(attention: Phase4AttentionItem[]): string {
  const critical = attention.find((item) => item.severity === "critical");
  return critical?.action ?? attention[0]?.action ?? "Review the latest market and company signals.";
}

export function buildPhase4ExecutiveBriefing(state: SimulationState): Phase4ExecutiveBriefing {
  const market = calculatePhase4MarketPulse(state);
  const health = calculatePhase4Health(state);
  const attention = buildPhase4Attention(state);
  const headline = attention[0]?.title ?? (health.overall >= 75 ? "The enterprise is operating from a position of strength" : "The enterprise is stable, but the next decision matters");
  const situation = `Day ${state.business.day}: ${state.business.name} is facing a ${market.economy} economy with ${Math.round(market.demand)}/100 demand and ${Math.round(market.competitivePressure)}/100 competitive pressure.`;
  const why = market.trend === "growing"
    ? "Demand conditions are improving, so capacity, pricing and customer retention matter more than simply cutting costs."
    : market.trend === "declining"
      ? "Demand conditions are weakening, so cash discipline and customer value are more important than aggressive expansion."
      : "Market conditions are mixed; the strongest decisions are those that preserve optionality while improving a clear bottleneck.";
  return {
    headline,
    situation,
    why,
    priorities: [
      { title: "Protect the constraint", detail: firstPriority(attention) },
      { title: "Read the market", detail: `${market.trend === "stable" ? "Stable" : market.trend} demand with ${Math.round(market.confidence)}/100 customer confidence.` },
      { title: "Keep execution healthy", detail: `Overall company health is ${Math.round(health.overall)}/100 with risk at ${Math.round(health.risk)}/100.` },
    ],
    attention,
    market,
    health,
  };
}

export function getPhase4CommandCenter(state: SimulationState, choices: SimulationChoice[] = []): Phase4CommandCenter {
  const briefing = buildPhase4ExecutiveBriefing(state);
  const previews = choices.map((choice) => previewPhase4Decision(state, choice));
  const competitors = [...(state.agents?.competitors ?? [])]
    .sort((a, b) => b.marketShare - a.marketShare)
    .slice(0, 5)
    .map((competitor) => ({ name: competitor.name, strategy: competitor.strategy, marketShare: round(competitor.marketShare), aggression: round(competitor.aggression) }));
  return {
    briefing,
    previews,
    recentEvents: (state.events ?? []).slice(0, 5).map((event) => ({ title: event.title, message: event.message, day: event.day })),
    competitors,
    activeScenarios: (state.scenarios?.active ?? []).map((scenario) => scenario.title),
  };
}

export function advancePhase4Day(state: SimulationState): SimulationState {
  return advanceLivingWorldDay(state);
}
