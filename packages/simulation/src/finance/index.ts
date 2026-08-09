import type { Business, FinancialSnapshot, OperationsState } from "@enterpriseverse/types";

export function calculateFinancialSnapshot(business: Business, operations: OperationsState, inventoryValue = 0, payroll = 0): FinancialSnapshot {
  const grossProfit = business.revenue - Math.max(0, inventoryValue * 0.6);
  const netProfit = business.revenue - business.expenses - payroll;
  const dailyBurn = Math.max(0, (business.expenses + payroll) / Math.max(1, business.day));
  const runwayDays = dailyBurn > 0 ? Math.floor(Math.max(0, business.cash) / dailyBurn) : 999;
  const workingCapital = business.cash + inventoryValue - operations.debt;
  const annualizedProfit = netProfit * 365 / Math.max(1, business.day);
  const valuation = Math.max(0, Math.round(Math.max(business.cash, annualizedProfit * 3) + business.reputation * 100 + business.marketShare * 1_000));
  return { day: business.day, revenue: business.revenue, expenses: business.expenses, grossProfit, netProfit, cash: business.cash, debt: operations.debt, inventoryValue, workingCapital, burnRate: dailyBurn, runwayDays, valuation };
}

export function financialHealth(snapshot: FinancialSnapshot): number {
  const runway = Math.min(100, snapshot.runwayDays / 90 * 100);
  const margin = snapshot.revenue > 0 ? Math.max(0, Math.min(100, snapshot.netProfit / snapshot.revenue * 100 + 50)) : 25;
  const workingCapital = snapshot.workingCapital >= 0 ? 100 : Math.max(0, 100 + snapshot.workingCapital / 1_000);
  return Math.round(runway * 0.4 + margin * 0.35 + workingCapital * 0.25);
}
