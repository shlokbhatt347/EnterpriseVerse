import type { Business, LifecycleStage, OperationsState } from "@enterpriseverse/types";

export function getLifecycleStage(business: Business): LifecycleStage {
  if (business.status === "exited") return "exit";
  if (business.status === "failed" || business.cash <= 0) return "crisis";
  if (business.day <= 7) return "launch";
  if (business.marketShare < 3 || business.revenue < business.expenses) return "survival";
  if (business.marketShare < 10) return "growth";
  if (business.marketShare < 25) return "expansion";
  return "maturity";
}

export function lifecycleModifiers(stage: LifecycleStage): { demand: number; cost: number; risk: number } {
  switch (stage) {
    case "launch": return { demand: 0.9, cost: 1.1, risk: 1.2 };
    case "survival": return { demand: 0.95, cost: 1.05, risk: 1.15 };
    case "growth": return { demand: 1.08, cost: 1.08, risk: 1.05 };
    case "expansion": return { demand: 1.15, cost: 1.12, risk: 1.1 };
    case "maturity": return { demand: 1.05, cost: 1, risk: 0.95 };
    case "crisis": return { demand: 0.75, cost: 1.2, risk: 1.4 };
    case "exit": return { demand: 0, cost: 0, risk: 0 };
  }
}

export function lifecycleCapacity(stage: LifecycleStage, operations: OperationsState): number {
  const multiplier = stage === "growth" || stage === "expansion" ? 1.1 : stage === "crisis" ? 0.8 : 1;
  return Math.max(0, Math.round(operations.productionCapacity * multiplier));
}
