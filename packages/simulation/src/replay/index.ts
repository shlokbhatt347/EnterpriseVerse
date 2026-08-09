import type { Business, FinancialSnapshot, MarketState, OperationsState, ReplaySnapshot, ReplayState } from "@enterpriseverse/types";

export function createReplayState(seed = 1): ReplayState { return { seed, snapshots: [], decisions: [] }; }

export function recordSnapshot(state: ReplayState, business: Business, operations?: OperationsState, market?: MarketState, financials?: FinancialSnapshot): ReplayState {
  const snapshot: ReplaySnapshot = { day: business.day, business: structuredClone(business), operations: operations ? structuredClone(operations) : undefined, market: market ? structuredClone(market) : undefined, financials: financials ? structuredClone(financials) : undefined };
  return { ...state, snapshots: [...state.snapshots, snapshot].slice(-365) };
}

export function recordDecision(state: ReplayState, decision: string): ReplayState { return { ...state, decisions: [...state.decisions, decision].slice(-500) }; }

export function compareSnapshots(a: ReplaySnapshot, b: ReplaySnapshot): Record<string, number> {
  return { cash: b.business.cash - a.business.cash, revenue: b.business.revenue - a.business.revenue, expenses: b.business.expenses - a.business.expenses, reputation: b.business.reputation - a.business.reputation, marketShare: b.business.marketShare - a.business.marketShare, customers: b.business.customers.length - a.business.customers.length };
}
