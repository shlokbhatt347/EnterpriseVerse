import type { SimulationState } from "@enterpriseverse/types";

export type PrototypeStage = "launch" | "survival" | "growth" | "expansion" | "maturity" | "distress" | "exit";

export interface PrototypeMilestone {
  day: number;
  title: string;
  description: string;
  category: "business" | "decision" | "risk" | "growth" | "learning";
}

export interface PrototypeSummary {
  stage: PrototypeStage;
  milestones: PrototypeMilestone[];
  isViable: boolean;
  isDistressed: boolean;
  progress: number;
}

/** Derives presentation-safe prototype status from the canonical simulation state. */
export function getPrototypeStage(state: SimulationState): PrototypeStage {
  const business = state.business;
  if (business.status !== "active") return business.cash > 0 ? "exit" : "distress";
  if (business.cash <= 0) return "distress";
  if (business.day <= 7) return "launch";
  if (business.day <= 30) return "survival";
  if (business.day <= 90) return "growth";
  if (business.day <= 180) return "expansion";
  return "maturity";
}

export function buildPrototypeSummary(state: SimulationState): PrototypeSummary {
  const stage = getPrototypeStage(state);
  const milestones: PrototypeMilestone[] = [];
  const log = state.log ?? [];

  for (const entry of log) {
    milestones.push({
      day: state.business.day,
      title: "Business activity",
      description: entry,
      category: "business",
    });
  }

  const isDistressed = stage === "distress";
  const progress = Math.min(100, Math.max(0, Math.round((state.business.day / 180) * 100)));

  return {
    stage,
    milestones: milestones.slice(-20),
    isViable: !isDistressed && state.business.cash > 0,
    isDistressed,
    progress,
  };
}
