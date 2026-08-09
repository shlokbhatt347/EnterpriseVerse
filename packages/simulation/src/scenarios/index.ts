import type { ActiveScenario, Business, ScenarioDefinition, ScenarioState } from "@enterpriseverse/types";

export const SCENARIOS: ScenarioDefinition[] = [
  { id: "inflation", category: "macro", title: "Input inflation", description: "Supplier costs rise across the market.", probability: 0.12, durationDays: 5, effects: { supplierCost: 0.12, demand: -0.04 }, tags: ["cost", "macro"] },
  { id: "demand-boom", category: "market", title: "Demand boom", description: "A trend brings new customers into the category.", probability: 0.1, durationDays: 4, effects: { demand: 0.2, acquisition: 0.1 }, tags: ["growth", "demand"] },
  { id: "recession", category: "macro", title: "Consumer slowdown", description: "Households reduce discretionary spending.", probability: 0.08, durationDays: 7, effects: { demand: -0.18, confidence: -0.12 }, tags: ["risk", "macro"] },
  { id: "supply-shortage", category: "supply", title: "Supplier shortage", description: "A logistics disruption limits available inputs.", probability: 0.09, durationDays: 4, effects: { inventory: -8, supplierReliability: -0.1 }, tags: ["supply", "operations"] },
  { id: "viral-product", category: "market", title: "Product takes off", description: "Word of mouth sharply increases attention.", probability: 0.05, durationDays: 3, effects: { demand: 0.3, reputation: 2 }, tags: ["growth", "brand"] },
];

function nextRandom(seed: number): number { const x = Math.sin(seed * 12.9898) * 43758.5453; return x - Math.floor(x); }

export function createScenarioState(seed = 1): ScenarioState { return { seed, active: [], history: [] }; }

export function advanceScenarios(state: ScenarioState, business: Business): { state: ScenarioState; effects: Record<string, number>; triggered: ActiveScenario[] } {
  const active = state.active.map((scenario) => ({ ...scenario, daysRemaining: scenario.daysRemaining - 1 })).filter((scenario) => scenario.daysRemaining > 0);
  const index = Math.abs(Math.floor(nextRandom(state.seed + business.day) * SCENARIOS.length));
  const candidate = SCENARIOS[index];
  const trigger = nextRandom(state.seed + business.day * 7) < candidate.probability && !active.some((s) => s.id === candidate.id);
  const triggered = trigger ? [{ ...candidate, startDay: business.day, daysRemaining: candidate.durationDays }] : [];
  const all = [...active, ...triggered];
  const effects: Record<string, number> = {};
  for (const scenario of all) for (const [key, value] of Object.entries(scenario.effects)) effects[key] = (effects[key] ?? 0) + value;
  return { state: { seed: state.seed, active: all, history: [...state.history, ...triggered.map((s) => `${business.day}: ${s.title}`)].slice(-50) }, effects, triggered };
}
