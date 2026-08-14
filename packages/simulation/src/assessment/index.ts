import type { Business, DecisionOutcome, EntrepreneurProfile, RunAssessment } from "@enterpriseverse/types";

const clamp = (v: number) => Math.max(0, Math.min(100, v));
export function scoreDecisionOutcome(decisionId: string, label: string, day: number, effects: Record<string, number> = {}): DecisionOutcome {
  const safeEffects = effects ?? {};
  const positive = Object.entries(safeEffects).reduce((sum, [key, value]) => sum + (key === "cash" || key === "revenue" || key === "reputation" || key === "marketShare" ? value : 0), 0);
  const score = clamp(50 + positive / 10);
  const explanation = positive >= 0 ? "The decision created a measurable positive business effect." : "The decision created a measurable cost or risk that should be monitored.";
  return { decisionId, label, day, effects: safeEffects, score, explanation };
}

export function assessRun(business: Business, outcomes: DecisionOutcome[] = []): RunAssessment {
  const profitability = business.revenue > 0 ? clamp((business.revenue - business.expenses) / Math.max(1, business.revenue) * 100 + 50) : 25;
  const resilience = clamp(business.cash / Math.max(1, business.expenses) * 5 + business.reputation * 0.4);
  const growth = clamp(business.marketShare * 3 + business.customers.length);
  const decisionQuality = outcomes.length ? outcomes.reduce((sum, o) => sum + o.score, 0) / outcomes.length : 50;
  const score = Math.round(profitability * 0.3 + resilience * 0.2 + growth * 0.2 + business.reputation * 0.15 + decisionQuality * 0.15);
  const primary = growth >= profitability && growth >= resilience ? "Growth strategist" : profitability >= resilience ? "Financial operator" : "Resilience-focused leader";
  const secondary = business.reputation >= 70 ? "Customer-first builder" : business.marketShare >= 15 ? "Market challenger" : "Disciplined founder";
  const strengths = [business.reputation >= 65 ? "Customer trust" : "Adaptability", business.cash > 0 ? "Liquidity awareness" : "Persistence", business.marketShare >= 10 ? "Market development" : "Early-stage execution"];
  const blindSpots = [business.expenses > business.revenue ? "Cost control" : "Scaling discipline", business.reputation < 50 ? "Reputation management" : "Defensive strategy", business.customers.length < 8 ? "Customer acquisition" : "Customer retention"];
  const lessons = outcomes.filter((o) => o.score < 45).slice(-3).map((o) => o.explanation);
  const recommendations = ["Review cash runway before major expansion.", "Compare customer retention with acquisition before increasing marketing.", "Use scenario and competitor signals to stress-test important decisions."];
  const profile: EntrepreneurProfile = { primary, secondary, strengths, blindSpots };
  return { score, profile, strengths, lessons, recommendations };
}
