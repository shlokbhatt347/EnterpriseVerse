import type { SimulationState } from "@enterpriseverse/types";

export type EndgameOutcome = "continue" | "ipo" | "acquired" | "merged" | "failed";

export type Phase7CompanySnapshot = {
  companyId: string;
  companyName: string;
  day: number;
  valuation: number;
  revenue: number;
  profit: number;
  cash: number;
  marketShare: number;
  reputation: number;
  growth: number;
  health: number;
  risk: number;
  outcome: EndgameOutcome;
};

export type Phase7Score = {
  overall: number;
  growth: number;
  profitability: number;
  market: number;
  resilience: number;
  reputation: number;
  innovation: number;
  sustainability: number;
};

export type Phase7Achievement = {
  id: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const safe = (value: number | null | undefined) => Number.isFinite(value) ? Number(value) : 0;

function revenueGrowth(state: SimulationState, revenue: number) {
  const snapshots = state.replay?.snapshots ?? [];
  if (snapshots.length < 2) return 0;
  const previous = safe(snapshots[snapshots.length - 2]?.financials?.revenue);
  return previous <= 0 ? 0 : ((revenue - previous) / previous) * 100;
}

export function getPhase7CompanySnapshot(state: SimulationState, companyId = state.business.id): Phase7CompanySnapshot {
  const profit = safe(state.financials?.netProfit ?? state.business.revenue - state.business.expenses);
  const cash = safe(state.financials?.cash ?? state.business.cash);
  const revenue = safe(state.financials?.revenue ?? state.business.revenue);
  const valuation = safe(state.phase5?.valuation ?? state.financials?.valuation);
  const debt = safe(state.phase5?.debt ?? state.financials?.debt);
  const growth = revenueGrowth(state, revenue);
  const risk = safe(state.phase5?.risks?.overall);
  const health = clamp(
    0.22 * clamp((profit / Math.max(1, revenue)) * 400 + 50) +
    0.18 * clamp(cash / Math.max(1, revenue) * 150 + 35) +
    0.16 * clamp(state.business.marketShare * 4 + 30) +
    0.14 * clamp(state.business.reputation) +
    0.12 * clamp(state.workforce?.moraleIndex ?? 70) +
    0.10 * clamp(state.phase5?.esg?.sustainabilityScore ?? 70) +
    0.08 * clamp(100 - risk),
  );

  let outcome: EndgameOutcome = "continue";
  const lastTransaction = state.phase5?.lastTransaction ?? "";
  if (state.business.status === "failed") outcome = "failed";
  else if (/ipo/i.test(lastTransaction)) outcome = "ipo";
  else if (/merge/i.test(lastTransaction)) outcome = "merged";
  else if (/acqui/i.test(lastTransaction)) outcome = "acquired";
  else if (state.business.status === "exited") outcome = "continue";

  void debt;
  return {
    companyId,
    companyName: state.business.name,
    day: state.business.day,
    valuation,
    revenue,
    profit,
    cash,
    marketShare: safe(state.business.marketShare),
    reputation: safe(state.business.reputation),
    growth,
    health,
    risk,
    outcome,
  };
}

export function calculatePhase7Score(snapshot: Phase7CompanySnapshot, state: SimulationState): Phase7Score {
  const profitability = clamp((snapshot.profit / Math.max(1, snapshot.revenue)) * 400 + 50);
  const growth = clamp(snapshot.growth * 3 + 50);
  const market = clamp(snapshot.marketShare * 4 + 30);
  const resilience = clamp(snapshot.cash / Math.max(1, snapshot.revenue) * 150 + 35 - snapshot.risk * 0.35);
  const reputation = clamp(snapshot.reputation);
  const innovation = clamp((state.market?.strategyScore ?? 60) * 0.7 + (state.phase5?.esg?.governance ?? 60) * 0.3);
  const sustainability = clamp(state.phase5?.esg?.sustainabilityScore ?? 70);
  const overall = Math.round(
    profitability * 0.22 + growth * 0.18 + market * 0.15 + resilience * 0.15 +
    reputation * 0.12 + innovation * 0.10 + sustainability * 0.08,
  );
  return { overall, growth, profitability, market, resilience, reputation, innovation, sustainability };
}

export function getPhase7Achievements(snapshot: Phase7CompanySnapshot, score: Phase7Score, state: SimulationState): Phase7Achievement[] {
  const achievements: Phase7Achievement[] = [];
  if (snapshot.revenue >= 1_000_000) achievements.push({ id: "million-revenue", title: "Million Club", description: "Reached ₹1M in revenue.", tier: "bronze" });
  if (snapshot.revenue >= 10_000_000) achievements.push({ id: "ten-million-revenue", title: "Scale-Up", description: "Reached ₹10M in revenue.", tier: "silver" });
  if (snapshot.marketShare >= 10) achievements.push({ id: "market-leader", title: "Market Leader", description: "Reached 10% market share.", tier: "gold" });
  if (score.resilience >= 85) achievements.push({ id: "fortress", title: "Fortress Balance Sheet", description: "Built exceptional financial resilience.", tier: "gold" });
  if (snapshot.reputation >= 90) achievements.push({ id: "trusted-brand", title: "Trusted Brand", description: "Built reputation above 90/100.", tier: "silver" });
  if ((state.phase5?.esg?.sustainabilityScore ?? 0) >= 90) achievements.push({ id: "sustainable-leader", title: "Sustainable Leader", description: "Reached a sustainability score above 90.", tier: "gold" });
  if (score.overall >= 90) achievements.push({ id: "enterprise-elite", title: "Enterprise Elite", description: "Reached an overall enterprise score of 90+.", tier: "platinum" });
  if (snapshot.outcome === "ipo") achievements.push({ id: "ipo", title: "Public Company", description: "Reached an IPO endgame.", tier: "platinum" });
  return achievements;
}
