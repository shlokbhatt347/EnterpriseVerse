import type { SimulationChoice, SimulationState } from "@enterpriseverse/types";
import { advanceDay as advanceDayLegacy, applyChoice as applyChoiceLegacy, createBusiness } from "./index";
import { assertSimulationState, validateSimulationState } from "./phase1";
import { createRandomStreams, type RandomStreams } from "./random";

export interface SimulationInput {
  name: string;
  idea: string;
  industry: string;
  structure: Parameters<typeof createBusiness>[0]["structure"];
  founderNames: string[];
  seed?: number;
}

export interface SimulationEngine {
  readonly state: SimulationState;
  readonly random: RandomStreams;
  choose(choice: SimulationChoice): SimulationEngine;
  advanceDay(): SimulationEngine;
  validate(): ReturnType<typeof validateSimulationState>;
  snapshot(): SimulationState;
}

const normalizeState = (state: SimulationState, seed: number): SimulationState => ({
  ...state,
  meta: { version: 1, seed, createdAtDay: state.meta?.createdAtDay ?? state.business.day },
  replay: state.replay ? { ...state.replay, seed } : state.replay,
});

const commit = (state: SimulationState, seed: number): SimulationState => {
  const normalized = normalizeState(state, seed);
  assertSimulationState(normalized);
  return normalized;
};

class Engine implements SimulationEngine {
  readonly state: SimulationState;
  readonly random: RandomStreams;

  constructor(state: SimulationState, seed: number) {
    this.state = commit(state, seed);
    this.random = createRandomStreams(seed);
  }

  choose(choice: SimulationChoice): SimulationEngine {
    return new Engine(applyChoiceLegacy(this.state, choice), this.state.meta?.seed ?? 1);
  }

  advanceDay(): SimulationEngine {
    return new Engine(advanceDayLegacy(this.state), this.state.meta?.seed ?? 1);
  }

  validate(): ReturnType<typeof validateSimulationState> {
    return validateSimulationState(this.state);
  }

  snapshot(): SimulationState {
    return structuredClone(this.state);
  }
}

export function createSimulation(input: SimulationInput): SimulationEngine {
  const seed = Number.isInteger(input.seed) ? input.seed! >>> 0 : 1;
  const state = createBusiness({
    name: input.name,
    idea: input.idea,
    industry: input.industry,
    structure: input.structure,
    founderNames: input.founderNames,
  });
  return new Engine(state, seed);
}
