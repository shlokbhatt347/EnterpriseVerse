import type { ScenarioCategory } from "@enterpriseverse/types";

export type Difficulty = "beginner" | "standard" | "advanced" | "expert";
export type BusinessArchetypeId = "local_retail" | "digital_product" | "creative_studio" | "food_business" | "service_company" | "light_manufacturing";

export interface BusinessArchetype {
  id: BusinessArchetypeId;
  name: string;
  description: string;
  strengths: string[];
  pressures: string[];
  recommendedDifficulty: Difficulty;
}

export interface ContentScenario {
  id: string;
  pack: string;
  category: ScenarioCategory;
  title: string;
  description: string;
  tags: string[];
  pressure: number;
}

export interface DifficultyProfile {
  id: Difficulty;
  label: string;
  scenarioPressure: number;
  eventFrequency: number;
  startingGuidance: boolean;
}

export const BUSINESS_ARCHETYPES: readonly BusinessArchetype[] = [
  { id: "local_retail", name: "Local Retail", description: "A customer-facing business balancing stock, pricing and footfall.", strengths: ["customer relationships", "fast feedback"], pressures: ["inventory", "price competition"], recommendedDifficulty: "beginner" },
  { id: "digital_product", name: "Digital Product", description: "A scalable product business where quality, acquisition and retention drive growth.", strengths: ["scalability", "high margins"], pressures: ["acquisition cost", "rapid competition"], recommendedDifficulty: "standard" },
  { id: "creative_studio", name: "Creative Studio", description: "A project-led studio balancing reputation, people and unpredictable demand.", strengths: ["differentiation", "reputation"], pressures: ["capacity", "client concentration"], recommendedDifficulty: "standard" },
  { id: "food_business", name: "Food Business", description: "A high-frequency operation where supply, quality and waste matter every day.", strengths: ["repeat demand", "rapid iteration"], pressures: ["waste", "input costs"], recommendedDifficulty: "advanced" },
  { id: "service_company", name: "Service Company", description: "A people-intensive business where delivery quality and utilization determine economics.", strengths: ["relationships", "recurring work"], pressures: ["workforce capacity", "cash timing"], recommendedDifficulty: "advanced" },
  { id: "light_manufacturing", name: "Light Manufacturing", description: "A production business coordinating procurement, capacity, quality and working capital.", strengths: ["operating leverage", "process improvement"], pressures: ["capital intensity", "supply disruption"], recommendedDifficulty: "expert" },
];

export const DIFFICULTIES: readonly DifficultyProfile[] = [
  { id: "beginner", label: "Beginner", scenarioPressure: 0.75, eventFrequency: 0.8, startingGuidance: true },
  { id: "standard", label: "Standard", scenarioPressure: 1, eventFrequency: 1, startingGuidance: true },
  { id: "advanced", label: "Advanced", scenarioPressure: 1.2, eventFrequency: 1.15, startingGuidance: false },
  { id: "expert", label: "Expert", scenarioPressure: 1.45, eventFrequency: 1.3, startingGuidance: false },
];

export const CONTENT_SCENARIOS: readonly ContentScenario[] = [
  { id: "market-demand-surge", pack: "market-pulse", category: "market", title: "Demand Surge", description: "A local trend is increasing demand faster than your current capacity.", tags: ["demand", "capacity"], pressure: 2 },
  { id: "market-price-war", pack: "market-pulse", category: "market", title: "Price War", description: "A competitor cuts prices and forces a response from the market.", tags: ["competition", "pricing"], pressure: 3 },
  { id: "market-new-entrant", pack: "market-pulse", category: "market", title: "New Entrant", description: "A well-funded competitor enters your strongest segment.", tags: ["competition", "market-share"], pressure: 3 },
  { id: "market-trend-reversal", pack: "market-pulse", category: "market", title: "Trend Reversal", description: "Customer interest shifts away from your current positioning.", tags: ["demand", "strategy"], pressure: 2 },
  { id: "market-premium-window", pack: "market-pulse", category: "market", title: "Premium Window", description: "Customers temporarily show stronger willingness to pay for quality.", tags: ["pricing", "quality"], pressure: 1 },
  { id: "finance-cash-crunch", pack: "financial-pressure", category: "finance", title: "Cash Crunch", description: "A timing mismatch puts pressure on working capital.", tags: ["cash", "runway"], pressure: 4 },
  { id: "finance-credit-offer", pack: "financial-pressure", category: "finance", title: "Credit Offer", description: "A lender offers capital with a meaningful repayment obligation.", tags: ["debt", "growth"], pressure: 2 },
  { id: "finance-cost-spike", pack: "financial-pressure", category: "finance", title: "Cost Spike", description: "A core operating cost rises unexpectedly.", tags: ["costs", "margin"], pressure: 3 },
  { id: "finance-customer-payment-delay", pack: "financial-pressure", category: "finance", title: "Payment Delay", description: "A major customer pays later than expected.", tags: ["cash-flow", "customers"], pressure: 3 },
  { id: "finance-growth-investment", pack: "financial-pressure", category: "finance", title: "Growth Investment", description: "An attractive expansion requires cash before returns arrive.", tags: ["investment", "growth"], pressure: 2 },
  { id: "ops-capacity-bottleneck", pack: "operations-edge", category: "operations", title: "Capacity Bottleneck", description: "Orders exceed what the current operation can reliably deliver.", tags: ["capacity", "operations"], pressure: 3 },
  { id: "ops-quality-drop", pack: "operations-edge", category: "operations", title: "Quality Drop", description: "Higher throughput begins to reduce quality.", tags: ["quality", "capacity"], pressure: 3 },
  { id: "ops-efficiency-win", pack: "operations-edge", category: "operations", title: "Efficiency Opportunity", description: "A process change could reduce unit costs but requires upfront effort.", tags: ["efficiency", "cost"], pressure: 1 },
  { id: "ops-equipment-failure", pack: "operations-edge", category: "operations", title: "Equipment Failure", description: "An operational asset becomes temporarily unavailable.", tags: ["capacity", "risk"], pressure: 4 },
  { id: "ops-service-backlog", pack: "operations-edge", category: "operations", title: "Service Backlog", description: "Demand creates a backlog that threatens customer satisfaction.", tags: ["service", "customers"], pressure: 3 },
  { id: "people-key-hire", pack: "people-dynamics", category: "people", title: "Key Hire", description: "A strong candidate could unlock growth but raises fixed costs.", tags: ["hiring", "growth"], pressure: 2 },
  { id: "people-turnover", pack: "people-dynamics", category: "people", title: "Unexpected Turnover", description: "A capable employee leaves at a difficult moment.", tags: ["turnover", "capacity"], pressure: 4 },
  { id: "people-morale", pack: "people-dynamics", category: "people", title: "Morale Signal", description: "Workload is affecting team morale and productivity.", tags: ["morale", "productivity"], pressure: 2 },
  { id: "people-training", pack: "people-dynamics", category: "people", title: "Training Window", description: "Training could raise capability but temporarily reduces capacity.", tags: ["training", "productivity"], pressure: 1 },
  { id: "people-founder-burnout", pack: "people-dynamics", category: "people", title: "Founder Load", description: "The founder is becoming a bottleneck for too many decisions.", tags: ["leadership", "capacity"], pressure: 3 },
  { id: "supply-delay", pack: "supply-shocks", category: "supply", title: "Supplier Delay", description: "A critical shipment arrives later than planned.", tags: ["lead-time", "inventory"], pressure: 3 },
  { id: "supply-shortage", pack: "supply-shocks", category: "supply", title: "Input Shortage", description: "A key input becomes temporarily scarce.", tags: ["shortage", "procurement"], pressure: 4 },
  { id: "supply-quality", pack: "supply-shocks", category: "supply", title: "Input Quality Issue", description: "A supplier's quality falls below the expected standard.", tags: ["quality", "supplier"], pressure: 3 },
  { id: "supply-second-source", pack: "supply-shocks", category: "supply", title: "Second Source", description: "A second supplier becomes available with different cost and reliability.", tags: ["supplier", "resilience"], pressure: 1 },
  { id: "supply-logistics", pack: "supply-shocks", category: "supply", title: "Logistics Disruption", description: "Transport disruption threatens delivery reliability.", tags: ["logistics", "customers"], pressure: 4 },
  { id: "macro-inflation", pack: "macro-shifts", category: "macro", title: "Inflation Pressure", description: "Input and operating costs rise across the economy.", tags: ["inflation", "costs"], pressure: 3 },
  { id: "macro-demand-slowdown", pack: "macro-shifts", category: "macro", title: "Demand Slowdown", description: "The wider economy weakens and customers become cautious.", tags: ["demand", "macro"], pressure: 4 },
  { id: "macro-confidence", pack: "macro-shifts", category: "macro", title: "Confidence Recovery", description: "Consumer confidence improves and creates a growth opportunity.", tags: ["demand", "growth"], pressure: 1 },
  { id: "macro-regulation", pack: "macro-shifts", category: "macro", title: "Regulatory Change", description: "A new requirement creates compliance work and potential opportunity.", tags: ["regulation", "risk"], pressure: 3 },
  { id: "macro-local-opportunity", pack: "macro-shifts", category: "macro", title: "Local Opportunity", description: "A change in the surrounding market opens a new customer segment.", tags: ["market", "growth"], pressure: 1 },
];

export function getDifficulty(id: Difficulty): DifficultyProfile {
  return DIFFICULTIES.find((profile) => profile.id === id) ?? DIFFICULTIES[1];
}

export function getArchetype(id: BusinessArchetypeId): BusinessArchetype {
  return BUSINESS_ARCHETYPES.find((archetype) => archetype.id === id) ?? BUSINESS_ARCHETYPES[0];
}

function hashSeed(seed: number): number {
  let value = Math.abs(Math.trunc(seed)) || 1;
  value = (value ^ 61) ^ (value >>> 16);
  value = value + (value << 3);
  value = value ^ (value >>> 4);
  value = value * 0x27d4eb2d;
  value = value ^ (value >>> 15);
  return Math.abs(value) >>> 0;
}

export function selectScenario(seed: number, day: number, difficulty: Difficulty = "standard", usedIds: readonly string[] = []): ContentScenario {
  const profile = getDifficulty(difficulty);
  const available = CONTENT_SCENARIOS.filter((scenario) => !usedIds.includes(scenario.id));
  const pool = available.length > 0 ? available : CONTENT_SCENARIOS;
  const index = hashSeed(hashSeed(seed) + day * 7919 + Math.round(profile.scenarioPressure * 100)) % pool.length;
  return pool[index];
}

export function replayFingerprint(seed: number, decisions: readonly string[], days: number): string {
  const input = `${seed}|${days}|${decisions.join(",")}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `ev-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
