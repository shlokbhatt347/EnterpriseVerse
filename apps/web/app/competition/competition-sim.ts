"use client";

import {
  advanceDay,
  applyBusinessAction,
  createBusiness,
} from "@enterpriseverse/simulation";
import type { SimulationState } from "@enterpriseverse/types";

type CompetitionPlayerSeed = { userId: string; displayName: string };

export type CompetitionDecision =
  | "balanced_growth"
  | "aggressive_growth"
  | "defensive_cash";

const STORAGE_PREFIX = "enterpriseverse:competition-sim:v2:";

function storageKey(roomId: string, userId: string) {
  return `${STORAGE_PREFIX}${roomId}:${userId}`;
}

function createInitialState(roomId: string, player: CompetitionPlayerSeed): SimulationState {
  return createBusiness({
    name: `Competition ${roomId.slice(0, 6)}`,
    idea: "Competitive enterprise simulation",
    industry: "Consumer services",
    structure: "sole_trader",
    founderNames: [player.displayName],
  });
}

function applyDecision(state: SimulationState, decision: CompetitionDecision): SimulationState {
  const actions = {
    balanced_growth: [
      { type: "set_price" as const, price: 120 },
      { type: "marketing" as const, budget: 500 },
    ],
    aggressive_growth: [
      { type: "set_price" as const, price: 135 },
      { type: "marketing" as const, budget: 1_200 },
    ],
    defensive_cash: [
      { type: "set_price" as const, price: 108 },
      { type: "marketing" as const, budget: 200 },
    ],
  }[decision];

  let next = state;
  for (const action of actions) next = applyBusinessAction(next, action);
  return advanceDay(next);
}

export function createCompetitionSimulation(roomId: string, player: CompetitionPlayerSeed): SimulationState {
  return createInitialState(roomId, player);
}

export function replayCompetitionSimulation(
  roomId: string,
  player: CompetitionPlayerSeed,
  decisions: Array<{ round: number; decisionId: string }>,
) {
  let state = createInitialState(roomId, player);
  for (const submission of [...decisions].sort((a, b) => a.round - b.round)) {
    if (!isCompetitionDecision(submission.decisionId)) continue;
    state = applyDecision(state, submission.decisionId);
  }
  return state;
}

export function applyCompetitionDecision(state: SimulationState, decisionId: string) {
  if (!isCompetitionDecision(decisionId)) throw new Error("Unsupported competition decision.");
  return applyDecision(state, decisionId);
}

export function isCompetitionDecision(value: string): value is CompetitionDecision {
  return value === "balanced_growth" || value === "aggressive_growth" || value === "defensive_cash";
}

export function saveCompetitionSimulation(roomId: string, userId: string, state: SimulationState) {
  try {
    sessionStorage.setItem(storageKey(roomId, userId), JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("enterpriseverse:competition-simulation"));
  } catch {
    // Server persistence remains authoritative; the browser cache is best-effort.
  }
}

export function loadCompetitionSimulation(roomId: string, userId: string): SimulationState | null {
  try {
    const raw = sessionStorage.getItem(storageKey(roomId, userId));
    return raw ? (JSON.parse(raw) as SimulationState) : null;
  } catch {
    return null;
  }
}
