import type { SimulationChoice, SimulationState } from "@enterpriseverse/types";
import { buildPhase4Attention, calculatePhase4Health, previewPhase4Decision } from "./phase4";
import { projectPhase4State, type Phase4Confidence, type Phase4Metric } from "./phase4-projection";

export type Phase4Horizon = "today" | "week" | "month" | "long_term";
export type Phase4Priority = "growth" | "profitability" | "stability" | "market_share" | "innovation" | "customer_value";
export interface Phase4Signal { id: string; title: string; detail: string; confidence: Phase4Confidence; severity: "info" | "watch" | "critical"; source: string; }
export interface Phase4IntelligenceReport { market: { demand: Phase4Metric; confidence: Phase4Metric; price: Phase4Metric; competitivePressure: Phase4Metric; trend: string }; finance: { cash: Phase4Metric; debt: Phase4Metric; profit: Phase4Metric; runwayDays: Phase4Metric; valuation: Phase4Metric }; customers: { count: number; trust: Phase4Metric; satisfaction: Phase4Metric; acquisition: Phase4Metric; churn: Phase4Metric }; operations: { capacity: Phase4Metric; inventory: Phase4Metric; quality: Phase4Metric; stockoutDays: Phase4Metric; workforceHealth: Phase4Metric }; workforce: { morale: Phase4Metric; productivity: Phase4Metric; retention: Phase4Metric }; competitors: Array<{ name: string; strategy: string; share: Phase4Metric; aggression: Phase4Metric; threat: "low" | "medium" | "high" }>; signals: Phase4Signal[]; }
export interface Phase4DecisionBrief { choiceId: string; label: string; horizon: Phase4Horizon; affectedSystems: string[]; preview: ReturnType<typeof previewPhase4Decision>; uncertainty: string; }
export interface Phase4StrategicPlan { priority: Phase4Priority; horizon: Phase4Horizon; rationale: string; focus: string[]; }
export interface Phase4TimelineItem { day: number; type: "decision" | "event" | "outcome"; title: string; detail: string; confidence: Phase4Confidence; }

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(v) ? v : min));
const metric = (v: number, confidence: Phase4Confidence, source: string): Phase4Metric => ({ value: Math.round((Number.isFinite(v) ? v : 0) * 10) / 10, confidence, source });
function threat(share: number, aggression: number): "low" | "medium" | "high" { const score = share * 0.6 + aggression * 0.4; return score >= 65 ? "high" : score >= 35 ? "medium" : "low"; }

export function buildPhase4IntelligenceReport(state: SimulationState): Phase4IntelligenceReport {
  const p = projectPhase4State(state);
  return {
    market: { demand: p.world.demand, confidence: p.world.confidence, price: p.world.priceIndex, competitivePressure: p.world.competitivePressure, trend: p.world.trend },
    finance: { cash: metric(p.finance.cash, "known", "business.cash"), debt: metric(p.finance.debt, "known", "financials.debt"), profit: metric(p.finance.profit, "known", "derived.profit"), runwayDays: metric(p.finance.runwayDays, "known", "financials.runwayDays"), valuation: metric(p.finance.valuation, p.business.valuation.confidence, "financials.valuation") },
    customers: { count: p.customers.count, trust: metric(p.customers.averageTrust, p.customers.confidence, "customer.trust.average"), satisfaction: metric(p.customers.satisfaction, p.customers.confidence, "operations.customerSatisfaction"), acquisition: metric(p.customers.acquisition, p.customers.confidence, "market.customerAcquisition"), churn: metric(p.customers.churnSignal, p.customers.confidence, "derived.churnSignal") },
    operations: { capacity: metric(p.operations.capacity, p.operations.confidence, "operations.productionCapacity"), inventory: metric(p.operations.inventory, "known", "business.inventory"), quality: metric(p.operations.quality, p.operations.confidence, "operations.quality"), stockoutDays: metric(p.operations.stockoutDays, "known", "supplyChain.stockoutDays"), workforceHealth: metric(p.operations.workforceHealth, p.operations.confidence, "derived.workforceHealth") },
    workforce: { morale: metric(p.workforce.morale, p.workforce.confidence, "workforce.moraleIndex"), productivity: metric(p.workforce.productivity, p.workforce.confidence, "workforce.productivityIndex"), retention: metric(p.workforce.retention, p.workforce.confidence, "derived.retention") },
    competitors: p.competitors.map((c) => ({ name: c.name, strategy: c.strategy, share: metric(c.marketShare, "estimated", "agents.competitor.marketShare"), aggression: metric(c.aggression, "estimated", "agents.competitor.aggression"), threat: threat(c.marketShare, c.aggression) })),
    signals: buildPhase4Signals(state, p),
  };
}

function buildPhase4Signals(state: SimulationState, p: ReturnType<typeof projectPhase4State>): Phase4Signal[] {
  const signals: Phase4Signal[] = [];
  const health = calculatePhase4Health(state);
  for (const item of buildPhase4Attention(state)) signals.push({ id: item.id, title: item.title, detail: `${item.reason} ${item.action}`, confidence: "estimated", severity: item.severity, source: item.metric ?? "health" });
  if (p.world.trend === "growing") signals.push({ id: "growth-window", title: "Demand is improving", detail: "Capacity and retention may be more valuable than defensive cost cutting while the market expands.", confidence: "estimated", severity: "info", source: "market.trend" });
  if (p.world.trend === "declining") signals.push({ id: "demand-downturn", title: "Demand is weakening", detail: "Protect liquidity and customer value before committing to irreversible expansion.", confidence: "estimated", severity: "watch", source: "market.trend" });
  if (health.overall >= 75 && health.risk <= 25) signals.push({ id: "optionality", title: "Strategic headroom is healthy", detail: "The business has room to invest selectively without ignoring downside risk.", confidence: "estimated", severity: "info", source: "health.overall" });
  return signals.sort((a, b) => ({ critical: 0, watch: 1, info: 2 }[a.severity] - { critical: 0, watch: 1, info: 2 }[b.severity])).slice(0, 10);
}

export function buildPhase4DecisionBriefs(state: SimulationState, choices: SimulationChoice[]): Phase4DecisionBrief[] {
  return choices.map((choice) => {
    const preview = previewPhase4Decision(state, choice);
    const effectMagnitude = Math.abs(preview.projected.cashDelta) + Math.abs(preview.projected.revenueDelta) + Math.abs(preview.projected.reputationDelta) + Math.abs(preview.projected.marketShareDelta);
    const horizon: Phase4Horizon = effectMagnitude >= 5000 ? "month" : effectMagnitude >= 1000 ? "week" : "today";
    const systems = [preview.projected.cashDelta !== 0 ? "finance" : "", preview.projected.revenueDelta !== 0 ? "market" : "", preview.projected.reputationDelta !== 0 ? "customers / reputation" : "", preview.projected.marketShareDelta !== 0 ? "competition" : ""].filter(Boolean);
    return { choiceId: choice.id, label: choice.label, horizon, affectedSystems: systems.length ? systems : ["business"], preview, uncertainty: "The preview uses current information; actual outcomes remain dependent on the next world transition." };
  });
}

export function buildPhase4StrategicPlan(state: SimulationState, priority: Phase4Priority = "stability"): Phase4StrategicPlan {
  const p = projectPhase4State(state);
  const plans: Record<Phase4Priority, Phase4StrategicPlan> = {
    growth: { priority, horizon: "month", rationale: "Use improving demand without allowing capacity or liquidity to become the bottleneck.", focus: ["capacity", "customer acquisition", "retention", "selective investment"] },
    profitability: { priority, horizon: "month", rationale: "Improve contribution and cash generation before adding fixed commitments.", focus: ["pricing", "unit economics", "operating efficiency", "cash"] },
    stability: { priority, horizon: "week", rationale: `Risk is ${Math.round(calculatePhase4Health(state).risk)}/100; preserve optionality and remove the largest constraint first.`, focus: ["liquidity", "supply continuity", "workforce health", "customer trust"] },
    market_share: { priority, horizon: "month", rationale: "Defend or expand position where competitive pressure is manageable and demand supports it.", focus: ["pricing", "availability", "differentiation", "competitor monitoring"] },
    innovation: { priority, horizon: "long_term", rationale: "Build durable advantage while protecting the operating base that funds experimentation.", focus: ["quality", "R&D", "skills", "long-term capital"] },
    customer_value: { priority, horizon: "week", rationale: "Increase trust and repeat behavior so acquisition compounds into retention rather than churn.", focus: ["service", "quality", "reliability", "retention"] },
  };
  return plans[priority];
}

export function buildPhase4Timeline(state: SimulationState): Phase4TimelineItem[] {
  const items: Phase4TimelineItem[] = [];
  for (const event of state.events ?? []) items.push({ day: event.day, type: "event", title: event.title, detail: event.message, confidence: "known" });
  for (const outcome of state.outcomes ?? []) items.push({ day: outcome.day, type: "outcome", title: outcome.label, detail: outcome.explanation, confidence: "known" });
  for (const entry of state.log ?? []) items.push({ day: state.business.day, type: "decision", title: "Simulation activity", detail: entry, confidence: "known" });
  return items.sort((a, b) => b.day - a.day).slice(0, 30);
}
export function phase4MetricBand(value: number): "critical" | "watch" | "healthy" { const n = clamp(value); return n < 35 ? "critical" : n < 60 ? "watch" : "healthy"; }
