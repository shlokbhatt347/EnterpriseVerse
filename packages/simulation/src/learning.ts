import type { SimulationState } from "@enterpriseverse/types";
import { calculateIntegratedMetrics } from "./integration";
import { calculateKpis, defaultOperations } from "./operations";

export type LearningDimension =
  | "financial-management"
  | "customer-focus"
  | "operations"
  | "market-strategy"
  | "risk-management"
  | "sustainable-growth";

export interface LearningScore {
  dimension: LearningDimension;
  score: number;
  evidence: string;
  nextStep: string;
}

export interface LearningAssessment {
  overallScore: number;
  level: "developing" | "capable" | "strong" | "exceptional";
  strengths: LearningScore[];
  priorities: LearningScore[];
  summary: string;
  reflectionQuestions: string[];
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const round = (value: number) => Math.round(value * 10) / 10;

function levelFor(score: number): LearningAssessment["level"] {
  if (score >= 85) return "exceptional";
  if (score >= 70) return "strong";
  if (score >= 50) return "capable";
  return "developing";
}

/**
 * Converts simulation outcomes into actionable learning feedback.
 * This is deliberately diagnostic rather than punitive: it explains evidence and
 * gives the learner a concrete next experiment instead of assigning a grade alone.
 */
export function assessLearning(state: SimulationState): LearningAssessment {
  const metrics = calculateIntegratedMetrics(state);
  const operations = state.operations ?? defaultOperations();
  const kpis = calculateKpis(state);
  const cashDays = kpis.cashRunwayDays;
  const debtPressure = operations.debt <= 0 ? 100 : clamp(100 - operations.debt / Math.max(1, state.business.cash + operations.debt) * 100);
  const growthQuality = clamp(
    50 + (state.business.marketShare - 1) * 1.5 + (metrics.businessHealth - 50) * 0.5 - Math.max(0, operations.debt - 5_000) / 500,
  );

  const scores: LearningScore[] = [
    {
      dimension: "financial-management",
      score: round(clamp(metrics.cashSafety * 0.6 + metrics.unitMargin * 0.4)),
      evidence: `Cash safety is ${metrics.cashSafety}/100 and unit margin is ${metrics.unitMargin}%.`,
      nextStep: cashDays < 14 ? "Protect liquidity before committing to another major expense." : "Compare the return from your next investment against its cash cost.",
    },
    {
      dimension: "customer-focus",
      score: round(clamp(metrics.customerRetention * 0.55 + kpis.customerSatisfaction * 0.45)),
      evidence: `Customer retention is ${metrics.customerRetention}/100 and satisfaction is ${kpis.customerSatisfaction}/100.`,
      nextStep: "Test one change that improves customer value without relying only on discounts.",
    },
    {
      dimension: "operations",
      score: round(clamp(metrics.operationalEfficiency * 0.65 + metrics.supplierReliability * 0.35)),
      evidence: `Operational efficiency is ${metrics.operationalEfficiency}/100 with supplier reliability at ${metrics.supplierReliability}/100.`,
      nextStep: "Balance capacity, inventory and supplier reliability before scaling volume.",
    },
    {
      dimension: "market-strategy",
      score: round(clamp(metrics.demandCapture * 0.5 + metrics.competitivePosition * 0.5)),
      evidence: `Demand capture is ${metrics.demandCapture}/100 and competitive position is ${metrics.competitivePosition}/100.`,
      nextStep: "Use market signals to choose whether to compete on price, quality or differentiation.",
    },
    {
      dimension: "risk-management",
      score: round(clamp(metrics.cashSafety * 0.45 + debtPressure * 0.35 + metrics.supplierReliability * 0.2)),
      evidence: `Liquidity, debt pressure and supplier reliability produce a risk score of ${round(clamp(metrics.cashSafety * 0.45 + debtPressure * 0.35 + metrics.supplierReliability * 0.2))}/100.`,
      nextStep: "Identify the single failure that could hurt the business most and create a mitigation before growth accelerates.",
    },
    {
      dimension: "sustainable-growth",
      score: round(growthQuality),
      evidence: `Market share is ${round(state.business.marketShare)}% while overall business health is ${metrics.businessHealth}/100.`,
      nextStep: "Prefer growth that strengthens customers, margins and resilience at the same time.",
    },
  ];

  const ordered = [...scores].sort((a, b) => b.score - a.score);
  const strengths = ordered.slice(0, 2);
  const priorities = ordered.slice(-2).reverse();
  const overallScore = round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length);
  const level = levelFor(overallScore);

  return {
    overallScore,
    level,
    strengths,
    priorities,
    summary: `Your current entrepreneurial performance is ${level}. The strongest evidence is in ${strengths[0].dimension}, while the highest-value improvement area is ${priorities[0].dimension}.`,
    reflectionQuestions: [
      "What decision most improved the business, and what evidence supports that conclusion?",
      "What trade-off did you accept to achieve your current result?",
      `If you had one more day, what would you change about ${priorities[0].dimension}?`,
    ],
  };
}

export function scoreDecisionOutcome(before: SimulationState, after: SimulationState): number {
  const beforeMetrics = calculateIntegratedMetrics(before);
  const afterMetrics = calculateIntegratedMetrics(after);
  const healthChange = afterMetrics.businessHealth - beforeMetrics.businessHealth;
  const cashChange = after.business.cash - before.business.cash;
  const reputationChange = after.business.reputation - before.business.reputation;
  const marketShareChange = after.business.marketShare - before.business.marketShare;

  // A decision is rewarded for improving the whole business, not just cash.
  return round(clamp(
    50 + healthChange * 2 + reputationChange * 0.5 + marketShareChange * 2 + (cashChange > 0 ? 3 : -3),
  ));
}
