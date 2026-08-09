import type { Consequence, ConsequenceState, SimulationState } from "@enterpriseverse/types";

export function createConsequenceState(): ConsequenceState { return { pending: [], resolved: [] }; }

export function scheduleConsequence(state: ConsequenceState, consequence: Consequence): ConsequenceState {
  return { ...state, pending: [...state.pending, consequence] };
}

export function advanceConsequences(state: ConsequenceState, day: number): { state: ConsequenceState; effects: Record<string, number>; explanations: string[] } {
  const due = state.pending.filter((item) => item.day + item.delayDays <= day);
  const pending = state.pending.filter((item) => item.day + item.delayDays > day);
  const effects: Record<string, number> = {};
  for (const consequence of due) for (const [key, value] of Object.entries(consequence.effects)) effects[key] = (effects[key] ?? 0) + value;
  return { state: { pending, resolved: [...state.resolved, ...due].slice(-100) }, effects, explanations: due.map((item) => item.explanation) };
}

export function consequenceFromChoice(state: SimulationState, source: string, effects: Record<string, number>, delayDays: number, explanation: string): Consequence {
  return { id: `consequence-${state.business.day}-${source}`, source, day: state.business.day, delayDays: Math.max(0, Math.round(delayDays)), effects, explanation };
}
