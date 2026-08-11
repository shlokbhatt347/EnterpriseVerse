import type { BusinessStructure, SimulationChoice, SimulationState } from "@enterpriseverse/types";
import { calculateKpis } from "./operations";
import { calculateIntegratedMetrics } from "./integration";

export interface FounderSetupOption { id: BusinessStructure; title: string; startingCapital: number; risk: "low" | "medium" | "high"; coordination: "low" | "medium" | "high"; description: string; }
export interface FirstSessionMilestone { id: string; title: string; description: string; completed: boolean; }
export interface DecisionDebrief { decisionId: string; title: string; score: number; consequence: string; signals: Array<{ label: string; value: string; direction: "positive" | "negative" | "neutral" }>; lesson: string; }
export type FounderSkill = "strategy" | "finance" | "marketing" | "operations" | "leadership" | "risk";
export type MilestoneStatus = "locked" | "current" | "complete";
export interface FounderProgressMilestone { id: string; title: string; description: string; targetDay: number; status: MilestoneStatus; progress: number; reward: string; }
export interface FounderSkills { strategy: number; finance: number; marketing: number; operations: number; leadership: number; risk: number; }
export interface FounderProgress { level: number; xp: number; xpToNextLevel: number; skills: FounderSkills; strengths: FounderSkill[]; growthAreas: FounderSkill[]; milestones: FounderProgressMilestone[]; health: "excellent" | "healthy" | "watch" | "critical"; }
export interface CoachInsight { headline: string; explanation: string; action: string; skill: FounderSkill; priority: "low" | "medium" | "high"; }

export const FOUNDER_SETUP_OPTIONS: FounderSetupOption[] = [
  { id: "sole_trader", title: "Sole Trader", startingCapital: 20_000, risk: "high", coordination: "low", description: "Maximum control and a simple start, but you carry the risk yourself." },
  { id: "partnership", title: "Partnership", startingCapital: 35_000, risk: "medium", coordination: "medium", description: "Share capital and decisions with another founder." },
  { id: "trio", title: "Trio", startingCapital: 50_000, risk: "medium", coordination: "high", description: "More capability and capital, balanced against coordination costs." },
  { id: "team", title: "Company", startingCapital: 75_000, risk: "low", coordination: "high", description: "More starting capital and capacity, with higher operating complexity." },
];

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
function direction(value: number): "positive" | "negative" | "neutral" { return value > 0.5 ? "positive" : value < -0.5 ? "negative" : "neutral"; }

export function getFirstSessionMilestones(state: SimulationState): FirstSessionMilestone[] {
  const business = state.business; const kpis = calculateKpis(state); const integrated = calculateIntegratedMetrics(state);
  return [
    { id: "company-created", title: "Create your company", description: `You launched ${business.name}.`, completed: Boolean(business.name) },
    { id: "first-sales", title: "Make your first sales", description: "Turn your product or service into real customer demand.", completed: business.revenue > 0 },
    { id: "protect-cash", title: "Protect your cash", description: "Maintain enough runway to keep making decisions.", completed: kpis.cashRunwayDays >= 14 },
    { id: "understand-market", title: "Read the market", description: "Use demand, competition and customer signals before reacting.", completed: Boolean(state.market && state.market.strategyScore >= 50) },
    { id: "learn-from-decision", title: "Learn from a consequence", description: "Make a decision and connect its outcome to a business signal.", completed: (state.outcomes?.length ?? 0) > 0 || (state.log?.length ?? 0) > 1 },
    { id: "build-health", title: "Build a healthy business", description: "Balance margin, customers, operations and cash rather than optimizing one number.", completed: integrated.businessHealth >= 65 },
  ];
}

export function buildFounderDashboard(state: SimulationState) {
  const kpis = calculateKpis(state); const integrated = calculateIntegratedMetrics(state);
  return { cash: state.business.cash, runwayDays: kpis.cashRunwayDays, revenue: state.business.revenue, profit: kpis.profit, customers: state.business.customers.length, marketShare: state.business.marketShare, businessHealth: integrated.businessHealth, milestones: getFirstSessionMilestones(state) };
}

export function buildDecisionDebrief(state: SimulationState, selected: SimulationChoice): DecisionDebrief {
  const effects = selected.effects;
  const weightedEffects = [["Cash", effects.cash ?? 0], ["Revenue", effects.revenue ?? 0], ["Reputation", effects.reputation ?? 0], ["Customer trust", effects.customerTrust ?? 0], ["Market share", effects.marketShare ?? 0], ["Inventory", effects.inventory ?? 0]] as const;
  const meaningful = weightedEffects.filter(([, value]) => value !== 0); const positive = meaningful.filter(([, value]) => value > 0).length; const negative = meaningful.filter(([, value]) => value < 0).length;
  const score = clamp(Math.round(50 + (positive - negative) * 12 + (effects.reputation ?? 0) * 2)); const strongest = [...meaningful].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
  const consequence = strongest ? `${strongest[0]} changed by ${strongest[1] > 0 ? "+" : ""}${strongest[1]}.` : "The decision had no directly declared numerical effect.";
  let lesson = "Every decision trades one business objective against another.";
  if ((effects.cash ?? 0) < 0 && (effects.revenue ?? 0) > 0) lesson = "You traded cash for growth. That can work when the additional demand generates enough return to protect your runway.";
  else if ((effects.reputation ?? 0) > 0 && (effects.cash ?? 0) < 0) lesson = "You spent money to protect trust. Reputation can support future demand, but the cost still has to be affordable.";
  else if ((effects.customerTrust ?? 0) < 0) lesson = "Short-term savings can create a longer-term customer relationship cost.";
  else if ((effects.marketShare ?? 0) > 0) lesson = "Growing market share is valuable only if the business can support the additional demand profitably.";
  return { decisionId: selected.id, title: selected.label, score, consequence, signals: meaningful.slice(0, 5).map(([label, value]) => ({ label, value: `${value > 0 ? "+" : ""}${value}`, direction: direction(value) })), lesson };
}

export function getFounderSkills(state: SimulationState): FounderSkills {
  const ops = state.operations; const market = state.market; const finance = state.financials; const workforce = state.workforce; const decisions = state.outcomes?.length ?? 0;
  const profitSignal = finance && finance.revenue > 0 ? clamp((finance.netProfit / Math.max(1, finance.revenue)) * 500 + 50) : 50;
  return {
    strategy: clamp(55 + (market?.strategyScore ?? 50) * 0.35 + decisions * 2),
    finance: clamp(45 + profitSignal * 0.45 + (finance?.runwayDays ?? 0) * 0.12),
    marketing: clamp(45 + (ops?.brandAwareness ?? 50) * 0.4),
    operations: clamp(45 + (ops?.productionCapacity ?? 50) * 0.15 + (workforce?.productivityIndex ?? 50) * 0.3),
    leadership: clamp(48 + (workforce?.moraleIndex ?? 50) * 0.25 + Math.min(20, state.business.founders.length * 4) + decisions * 1.5),
    risk: clamp(45 + (finance?.runwayDays ?? 0) * 0.08 + state.business.reputation * 0.2 - (state.scenarios?.active.length ?? 0) * 3),
  };
}

export function getFounderProgress(state: SimulationState): FounderProgress {
  const skills = getFounderSkills(state); const avg = Object.values(skills).reduce((sum, value) => sum + value, 0) / 6;
  const xp = Math.max(0, Math.round(state.business.day * 80 + (state.outcomes?.length ?? 0) * 120 + avg * 4)); const level = Math.max(1, Math.floor(xp / 500) + 1);
  const ranked = (Object.entries(skills) as [FounderSkill, number][]).sort((a, b) => b[1] - a[1]);
  const milestones: FounderProgressMilestone[] = [
    { id: "first-sale", title: "First customer", description: "Generate your first sale and prove demand.", targetDay: 3, status: state.business.revenue > 0 ? "complete" : "current", progress: state.business.revenue > 0 ? 100 : clamp(state.business.day * 33), reward: "+100 XP" },
    { id: "survive-week", title: "Survive the first week", description: "Reach Day 7 without failing the business.", targetDay: 7, status: state.business.day >= 7 ? "complete" : "current", progress: clamp((state.business.day / 7) * 100), reward: "+200 XP" },
    { id: "profit", title: "Find product-market fit", description: "Finish with positive net profit.", targetDay: 14, status: (state.financials?.netProfit ?? 0) > 0 ? "complete" : state.business.day >= 14 ? "current" : "locked", progress: (state.financials?.netProfit ?? 0) > 0 ? 100 : clamp((state.business.day / 14) * 100), reward: "+300 XP" },
    { id: "market-share", title: "Earn your place", description: "Reach 5% market share.", targetDay: 30, status: state.business.marketShare >= 5 ? "complete" : state.business.day >= 15 ? "current" : "locked", progress: clamp((state.business.marketShare / 5) * 100), reward: "+500 XP" },
  ];
  const health = state.business.status === "failed" || state.business.cash <= 0 ? "critical" : (state.financials?.runwayDays ?? 0) < 7 ? "watch" : avg >= 70 ? "excellent" : "healthy";
  return { level, xp, xpToNextLevel: level * 500, skills, strengths: ranked.slice(0, 2).map(([key]) => key), growthAreas: ranked.slice(-2).map(([key]) => key), milestones, health };
}

export function getCoachInsight(state: SimulationState): CoachInsight {
  const progress = getFounderProgress(state); const runway = state.financials?.runwayDays ?? 0;
  if (runway < 7) return { headline: "Protect your runway", explanation: `You have about ${runway} days of cash coverage. Growth is less important than staying solvent long enough to learn.`, action: `Prioritise cash-generating actions and avoid commitments that consume more than ${money(state.business.cash * 0.25)} at once.`, skill: "finance", priority: "high" };
  if ((state.market?.competitivePressure ?? 0) > 65) return { headline: "Competition is tightening", explanation: "Competitors are putting pressure on your position. Matching every move can destroy your margin.", action: "Consider differentiation through quality, customer experience or a focused segment instead of an automatic price cut.", skill: "strategy", priority: "high" };
  if (state.business.reputation < 45) return { headline: "Trust needs attention", explanation: "Your reputation is becoming a constraint on demand and resilience.", action: "Improve customer experience before spending heavily on acquisition.", skill: "leadership", priority: "medium" };
  if ((state.operations?.brandAwareness ?? 50) < 45) return { headline: "Your market may not know you", explanation: "Awareness is relatively low, so strong product economics may not translate into enough demand.", action: "Run a measured marketing test and compare incremental revenue with its cost.", skill: "marketing", priority: "medium" };
  return { headline: "You have room to experiment", explanation: `Your business is ${progress.health}. Use the next decision to test a hypothesis rather than simply chasing the biggest short-term number.`, action: "Write down what you expect, make one meaningful change, then compare the result with your expectation.", skill: "strategy", priority: "low" };
}

export function getStructureGuidance(structure: BusinessStructure) {
  const guidance: Record<BusinessStructure, { title: string; tradeoff: string; bestFor: string }> = {
    sole_trader: { title: "Maximum control", tradeoff: "Lower starting capital but concentrated founder risk.", bestFor: "A focused founder testing a simple idea." },
    partnership: { title: "Shared ownership", tradeoff: "More capital and capability, with coordination costs.", bestFor: "A business where two complementary founders matter." },
    trio: { title: "Balanced founding team", tradeoff: "More capability, but decisions need alignment.", bestFor: "A business with several functions that need early coverage." },
    team: { title: "Scale-oriented company", tradeoff: "Most starting capital, highest fixed operating cost.", bestFor: "A larger ambition where execution capacity matters from day one." },
  };
  return guidance[structure];
}
