import type { OperationsState, Phase5RiskLevel, SimulationState } from "@enterpriseverse/types";
import { calculateKpis } from "./operations";

export type AdvisorRole = "ceo" | "cfo" | "cmo" | "coo" | "cto" | "chro";
export type InsightSeverity = "critical" | "warning" | "opportunity" | "info";

export interface EnterpriseInsight {
  id: string;
  role: AdvisorRole;
  severity: InsightSeverity;
  title: string;
  evidence: string;
  recommendation: string;
  rationale: string;
  metric?: { label: string; value: string };
}

export interface EnterpriseBrief {
  role: AdvisorRole;
  headline: string;
  summary: string;
  healthScore: number;
  priorities: EnterpriseInsight[];
  metrics: Array<{ label: string; value: string; detail: string }>;
  riskLevel: Phase5RiskLevel | "unknown";
}

export interface WhatIfInput {
  priceDeltaPct?: number;
  marketingBudget?: number;
  qualityInvestment?: number;
  hiring?: number;
  debtPayment?: number;
}

export interface WhatIfResult {
  inputs: WhatIfInput;
  projected: {
    cash: number;
    revenue: number;
    netProfit: number;
    customers: number;
    marketShare: number;
    reputation: number;
  };
  deltas: Record<string, number>;
  warnings: string[];
  confidence: "high" | "medium" | "directional";
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const pct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
const safeOps = (state: SimulationState): OperationsState => state.operations ?? {
  price: 120,
  quality: 70,
  marketingBudget: 0,
  productionCapacity: 20,
  employees: state.workforce?.employees.length ?? 1,
  supplierUnitCost: 60,
  brandAwareness: 50,
  customerSatisfaction: 70,
  debt: state.phase5?.debt ?? 0,
};

function roleFocus(role: AdvisorRole): string {
  return ({
    ceo: "company-wide priorities",
    cfo: "cash, margins and financial resilience",
    cmo: "demand, customers and market growth",
    coo: "capacity, inventory and operational resilience",
    cto: "quality, product capability and innovation",
    chro: "people capacity, productivity and organizational health",
  })[role];
}

function commonInsights(state: SimulationState): EnterpriseInsight[] {
  const kpis = calculateKpis(state);
  const market = state.market;
  const workforce = state.workforce;
  const economy = state.economy;
  const insights: EnterpriseInsight[] = [];

  if (kpis.cashRunwayDays < 14) insights.push({
    id: "short-runway", role: "ceo", severity: "critical", title: "Protect cash runway",
    evidence: `Estimated runway is ${kpis.cashRunwayDays} days with ${money(state.business.cash)} cash.`,
    recommendation: "Delay discretionary spending and review financing before taking another major commitment.",
    rationale: "A short runway reduces the company's ability to absorb normal market or supply shocks.",
    metric: { label: "Runway", value: `${kpis.cashRunwayDays} days` },
  });

  if (market && market.trend === "growing" && market.demandIndex > 105) insights.push({
    id: "demand-window", role: "cmo", severity: "opportunity", title: "Demand is creating a growth window",
    evidence: `Demand index is ${market.demandIndex} and the market trend is growing.`,
    recommendation: "Test whether additional acquisition spend or inventory can capture the upside without creating a cash squeeze.",
    rationale: "A growing market rewards well-timed capacity and customer acquisition, but excess spend can destroy the benefit.",
    metric: { label: "Demand index", value: `${market.demandIndex}` },
  });

  const supply = economy?.supplyChain;
  if (supply && supply.stockoutDays > 0) insights.push({
    id: "stockout", role: "coo", severity: "warning", title: "Stockouts are leaking demand",
    evidence: `The business has recorded ${supply.stockoutDays} stockout day(s).`,
    recommendation: "Review reorder points and supplier reliability before increasing marketing or price-led demand.",
    rationale: "Generating more demand while unable to fulfill it reduces revenue and can damage reputation.",
    metric: { label: "Stockout days", value: `${supply.stockoutDays}` },
  });

  const morale = workforce?.moraleIndex ?? 100;
  if (morale < 65) insights.push({
    id: "morale", role: "chro", severity: "warning", title: "Workforce morale is becoming a constraint",
    evidence: `Current workforce morale is ${Math.round(morale)}/100.`,
    recommendation: "Review workload, staffing and training before adding another aggressive growth initiative.",
    rationale: "Low morale can reduce productivity and increase turnover risk, compounding operating costs.",
    metric: { label: "Morale", value: `${Math.round(morale)}/100` },
  });

  if (kpis.grossMargin < 20) insights.push({
    id: "margin-pressure", role: "cfo", severity: "warning", title: "Margin pressure needs attention",
    evidence: `Gross margin is ${kpis.grossMargin}%.`,
    recommendation: "Investigate unit economics before pursuing volume-led growth.",
    rationale: "Growing low-margin volume can increase operational load without improving financial resilience.",
    metric: { label: "Gross margin", value: `${kpis.grossMargin}%` },
  });

  if (safeOps(state).quality < 55) insights.push({
    id: "quality", role: "cto", severity: "warning", title: "Product quality is a competitive vulnerability",
    evidence: `Current quality is ${Math.round(safeOps(state).quality)}/100.`,
    recommendation: "Consider targeted quality investment before competing on price.",
    rationale: "Low quality can weaken customer trust and makes price competition harder to sustain.",
    metric: { label: "Quality", value: `${Math.round(safeOps(state).quality)}/100` },
  });

  if (!insights.length) insights.push({
    id: "steady-state", role: "ceo", severity: "info", title: "No critical signal is dominating the company",
    evidence: `Cash is ${money(state.business.cash)}, reputation is ${Math.round(state.business.reputation)}/100 and market share is ${state.business.marketShare.toFixed(1)}%.`,
    recommendation: "Use the next decision to strengthen one strategic capability rather than optimizing everything at once.",
    rationale: "Focused improvements are easier to execute and make cause-and-effect easier to observe.",
  });
  return insights;
}

function roleInsights(state: SimulationState, role: AdvisorRole): EnterpriseInsight[] {
  const kpis = calculateKpis(state);
  const ops = safeOps(state);
  const market = state.market;
  const workforce = state.workforce;
  const insights: EnterpriseInsight[] = [];

  if (role === "ceo") return commonInsights(state).map((item) => ({ ...item, role }));

  if (role === "cfo") {
    if (kpis.debt > 0 && state.business.cash < kpis.debt * 0.5) insights.push({ id: "cfo-leverage", role, severity: "critical", title: "Debt is competing with liquidity", evidence: `Debt is ${money(kpis.debt)} against ${money(state.business.cash)} cash.`, recommendation: "Protect liquidity before taking on additional debt or discretionary commitments.", rationale: "A fragile cash-to-debt position reduces flexibility when markets move against you." });
    insights.push({ id: "cfo-margin", role, severity: kpis.grossMargin < 20 ? "warning" : "info", title: "Monitor contribution quality", evidence: `Gross margin is ${kpis.grossMargin}% with revenue of ${money(state.business.revenue)}.`, recommendation: "Compare unit price, supplier cost and demand before changing volume targets.", rationale: "Financial quality is driven by the interaction of price, cost and fulfilled demand." });
  }

  if (role === "cmo" && market) {
    insights.push({ id: "cmo-position", role, severity: market.competitivePressure > 70 ? "warning" : "info", title: "Market position needs a clear thesis", evidence: `Competitive pressure is ${Math.round(market.competitivePressure)}/100 and customer acquisition is ${Math.round(market.customerAcquisition)}.`, recommendation: "Choose whether to win on price, quality or a specific customer segment rather than pursuing all three at once.", rationale: "A clear positioning choice improves the efficiency of marketing spend." });
  }

  if (role === "coo") {
    const supply = state.economy?.supplyChain;
    insights.push({ id: "coo-capacity", role, severity: ops.productionCapacity <= state.business.inventory ? "warning" : "info", title: "Balance capacity with inventory", evidence: `Production capacity is ${ops.productionCapacity} units and inventory is ${state.business.inventory}.`, recommendation: "Adjust production and procurement to match actual demand rather than forecast alone.", rationale: "Overcapacity ties up cost; undercapacity creates missed demand and stockouts." });
    if (supply) insights.push({ id: "coo-supply", role, severity: supply.disruption !== "none" ? "critical" : "info", title: "Supply resilience", evidence: `Current supply status is ${supply.disruption === "none" ? "normal" : supply.disruption}.`, recommendation: supply.disruption === "none" ? "Maintain supplier diversification as you scale." : "Prioritize alternative supply before adding new demand.", rationale: "Operational resilience reduces the chance that a localized disruption becomes a company-wide problem." });
  }

  if (role === "cto") {
    insights.push({ id: "cto-quality", role, severity: ops.quality < 60 ? "warning" : "info", title: "Product capability", evidence: `Quality is ${Math.round(ops.quality)}/100 and customer satisfaction is ${Math.round(kpis.customerSatisfaction)}%.`, recommendation: "Use targeted quality investment where it improves both satisfaction and differentiation.", rationale: "Technology/product investment should create measurable customer or efficiency value." });
  }

  if (role === "chro") {
    insights.push({ id: "chro-workforce", role, severity: (workforce?.turnoverRisk ?? 0) > 30 ? "warning" : "info", title: "Workforce capacity", evidence: `Productivity is ${Math.round(workforce?.productivityIndex ?? 0)}/100 and turnover risk is ${Math.round(workforce?.turnoverRisk ?? 0)}/100.`, recommendation: "Balance hiring, workload and training instead of adding headcount by default.", rationale: "People capacity is a system constraint, not simply a headcount target." });
  }

  return [...commonInsights(state).filter((item) => item.role === role), ...insights].slice(0, 5);
}

function healthScore(state: SimulationState): number {
  const kpis = calculateKpis(state);
  const finance = clamp(50 + Math.min(50, (kpis.netProfit / Math.max(1, Math.abs(state.business.revenue))) * 100));
  const cash = clamp(Math.min(100, kpis.cashRunwayDays * 3));
  const market = clamp(state.business.marketShare * 8 + (state.market?.strategyScore ?? 50) * 0.35);
  const people = state.workforce ? (state.workforce.productivityIndex * 0.55 + state.workforce.moraleIndex * 0.45) : 70;
  return Math.round(finance * 0.3 + cash * 0.25 + market * 0.2 + state.business.reputation * 0.15 + people * 0.1);
}

export function buildEnterpriseBrief(state: SimulationState, role: AdvisorRole): EnterpriseBrief {
  const kpis = calculateKpis(state);
  const insights = roleInsights(state, role);
  const risk = state.phase5?.risks?.level ?? (kpis.cashRunwayDays < 14 ? "critical" : kpis.cashRunwayDays < 30 ? "high" : "moderate");
  const score = healthScore(state);
  return {
    role,
    headline: `${state.business.name} needs attention on ${roleFocus(role)}.`,
    summary: insights[0]?.evidence ?? "The business is operating without a dominant signal.",
    healthScore: score,
    priorities: insights,
    riskLevel: risk,
    metrics: [
      { label: "Cash", value: money(state.business.cash), detail: `${kpis.cashRunwayDays} days runway` },
      { label: "Revenue", value: money(state.business.revenue), detail: `${kpis.grossMargin}% gross margin` },
      { label: "Market share", value: `${state.business.marketShare.toFixed(1)}%`, detail: `${state.market?.trend ?? "stable"} market` },
      { label: "Reputation", value: `${Math.round(state.business.reputation)}/100`, detail: `${Math.round(kpis.customerSatisfaction)}% satisfaction` },
    ],
  };
}

export function runWhatIf(state: SimulationState, input: WhatIfInput): WhatIfResult {
  const operations = safeOps(state);
  const kpis = calculateKpis(state);
  const priceDelta = input.priceDeltaPct ?? 0;
  const marketing = Math.max(0, input.marketingBudget ?? operations.marketingBudget);
  const quality = Math.max(0, input.qualityInvestment ?? 0);
  const hiring = Math.max(0, input.hiring ?? 0);
  const debtPayment = Math.max(0, input.debtPayment ?? 0);

  const elasticity = state.market?.priceElasticity ?? -1;
  const demandMultiplier = clamp(1 + (priceDelta / 100) * elasticity, 0.5, 1.5);
  const acquisitionLift = Math.min(0.25, marketing / Math.max(1, state.business.revenue + 10_000) * 0.8);
  const qualityLift = Math.min(8, quality / 1_000);
  const projectedCustomers = Math.max(0, Math.round(state.business.customers.length * (1 + acquisitionLift) * demandMultiplier));
  const projectedPrice = Math.max(1, operations.price * (1 + priceDelta / 100));
  const projectedRevenue = Math.max(0, state.business.revenue * demandMultiplier + projectedCustomers * projectedPrice * 0.05);
  const extraCosts = marketing + quality + hiring * 450;
  const projectedExpenses = state.business.expenses + extraCosts;
  const projectedProfit = projectedRevenue - projectedExpenses;
  const projectedCash = state.business.cash + (projectedRevenue - state.business.revenue) - extraCosts - debtPayment;
  const projectedShare = clamp(state.business.marketShare + (demandMultiplier - 1) * 12 + acquisitionLift * 8 + qualityLift * 0.4);
  const projectedReputation = clamp(state.business.reputation + qualityLift * 0.7 - Math.max(0, -priceDelta) * 0.02);
  const warnings: string[] = [];
  if (projectedCash < 0) warnings.push("This scenario pushes cash below zero.");
  if (projectedCustomers > state.business.customers.length * 1.3 && state.business.inventory < projectedCustomers) warnings.push("Projected demand may exceed available inventory.");
  if (debtPayment > state.business.cash) warnings.push("Debt payment exceeds current cash capacity.");

  const projected = { cash: Math.round(projectedCash), revenue: Math.round(projectedRevenue), netProfit: Math.round(projectedProfit), customers: projectedCustomers, marketShare: Number(projectedShare.toFixed(2)), reputation: Number(projectedReputation.toFixed(1)) };
  return {
    inputs: { ...input },
    projected,
    deltas: {
      cash: projected.cash - state.business.cash,
      revenue: projected.revenue - state.business.revenue,
      netProfit: projected.netProfit - kpis.netProfit,
      customers: projected.customers - state.business.customers.length,
      marketShare: projected.marketShare - state.business.marketShare,
      reputation: projected.reputation - state.business.reputation,
    },
    warnings,
    confidence: warnings.length ? "directional" : state.replay?.snapshots.length && state.replay.snapshots.length > 5 ? "medium" : "high",
  };
}
