import type { BusinessStructure, SimulationChoice, SimulationState } from "@enterpriseverse/types";
import { calculateKpis } from "./operations";
import { calculateIntegratedMetrics } from "./integration";

export interface FounderSetupOption {
  id: BusinessStructure;
  title: string;
  startingCapital: number;
  risk: "low" | "medium" | "high";
  coordination: "low" | "medium" | "high";
  description: string;
}

export interface FirstSessionMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface DecisionDebrief {
  decisionId: string;
  title: string;
  score: number;
  consequence: string;
  signals: Array<{ label: string; value: string; direction: "positive" | "negative" | "neutral" }>;
  lesson: string;
}

export interface FounderDashboard {
  cash: number;
  runwayDays: number;
  revenue: number;
  profit: number;
  customers: number;
  marketShare: number;
  businessHealth: number;
  milestones: FirstSessionMilestone[];
}

export const FOUNDER_SETUP_OPTIONS: FounderSetupOption[] = [
  { id: "sole_trader", title: "Sole Trader", startingCapital: 20_000, risk: "high", coordination: "low", description: "Maximum control and a simple start, but you carry the risk yourself." },
  { id: "partnership", title: "Partnership", startingCapital: 35_000, risk: "medium", coordination: "medium", description: "Share capital and decisions with another founder." },
  { id: "trio", title: "Trio", startingCapital: 50_000, risk: "medium", coordination: "high", description: "More capability and capital, balanced against coordination costs." },
  { id: "team", title: "Company", startingCapital: 75_000, risk: "low", coordination: "high", description: "More starting capital and capacity, with higher operating complexity." },
];

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

function direction(value: number): "positive" | "negative" | "neutral" {
  if (value > 0.5) return "positive";
  if (value < -0.5) return "negative";
  return "neutral";
}

/**
 * Creates a short, explainable first-session path from the canonical state.
 * It deliberately reads simulation state and never mutates it.
 */
export function getFirstSessionMilestones(state: SimulationState): FirstSessionMilestone[] {
  const business = state.business;
  const kpis = calculateKpis(state);
  const integrated = calculateIntegratedMetrics(state);
  return [
    { id: "company-created", title: "Create your company", description: `You launched ${business.name}.`, completed: Boolean(business.name) },
    { id: "first-sales", title: "Make your first sales", description: "Turn your product or service into real customer demand.", completed: business.revenue > 0 },
    { id: "protect-cash", title: "Protect your cash", description: "Maintain enough runway to keep making decisions.", completed: kpis.cashRunwayDays >= 14 },
    { id: "understand-market", title: "Read the market", description: "Use demand, competition and customer signals before reacting.", completed: Boolean(state.market && state.market.strategyScore >= 50) },
    { id: "learn-from-decision", title: "Learn from a consequence", description: "Make a decision and connect its outcome to a business signal.", completed: (state.outcomes?.length ?? 0) > 0 || (state.log?.length ?? 0) > 1 },
    { id: "build-health", title: "Build a healthy business", description: "Balance margin, customers, operations and cash rather than optimizing one number.", completed: integrated.businessHealth >= 65 },
  ];
}

export function buildFounderDashboard(state: SimulationState): FounderDashboard {
  const kpis = calculateKpis(state);
  const integrated = calculateIntegratedMetrics(state);
  return {
    cash: state.business.cash,
    runwayDays: kpis.cashRunwayDays,
    revenue: state.business.revenue,
    profit: kpis.profit,
    customers: state.business.customers.length,
    marketShare: state.business.marketShare,
    businessHealth: integrated.businessHealth,
    milestones: getFirstSessionMilestones(state),
  };
}

/**
 * Converts a chosen event into a player-readable debrief. The explanation is based on
 * the declared effects, so the UI can teach the consequence without inventing results.
 */
export function buildDecisionDebrief(
  state: SimulationState,
  selected: SimulationChoice,
): DecisionDebrief {
  const effects = selected.effects;
  const weightedEffects = [
    ["Cash", effects.cash ?? 0],
    ["Revenue", effects.revenue ?? 0],
    ["Reputation", effects.reputation ?? 0],
    ["Customer trust", effects.customerTrust ?? 0],
    ["Market share", effects.marketShare ?? 0],
    ["Inventory", effects.inventory ?? 0],
  ] as const;
  const meaningful = weightedEffects.filter(([, value]) => value !== 0);
  const positive = meaningful.filter(([, value]) => value > 0).length;
  const negative = meaningful.filter(([, value]) => value < 0).length;
  const score = clamp(Math.round(50 + (positive - negative) * 12 + (effects.reputation ?? 0) * 2));
  const strongest = [...meaningful].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
  const consequence = strongest
    ? `${strongest[0]} changed by ${strongest[1] > 0 ? "+" : ""}${strongest[1]}.`
    : "The decision had no directly declared numerical effect.";

  let lesson = "Every decision trades one business objective against another.";
  if ((effects.cash ?? 0) < 0 && (effects.revenue ?? 0) > 0) lesson = "You traded cash for growth. That can work when the additional demand generates enough return to protect your runway.";
  else if ((effects.reputation ?? 0) > 0 && (effects.cash ?? 0) < 0) lesson = "You spent money to protect trust. Reputation can support future demand, but the cost still has to be affordable.";
  else if ((effects.customerTrust ?? 0) < 0) lesson = "Short-term savings can create a longer-term customer relationship cost.";
  else if ((effects.marketShare ?? 0) > 0) lesson = "Growing market share is valuable only if the business can support the additional demand profitably.";

  return {
    decisionId: selected.id,
    title: selected.label,
    score,
    consequence,
    signals: meaningful.slice(0, 5).map(([label, value]) => ({ label, value: `${value > 0 ? "+" : ""}${value}`, direction: direction(value) })),
    lesson,
  };
}
