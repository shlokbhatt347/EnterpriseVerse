import type { BusinessStructure, SimulationChoice, SimulationEvent, SimulationState } from "@enterpriseverse/types";
import { advanceDay, applyChoice, createBusiness } from "./index";

export type Phase16Difficulty = "beginner" | "standard" | "advanced" | "expert" | "founder";
export type Phase16Archetype = "tech_startup" | "retail" | "food" | "manufacturing" | "ecommerce" | "saas" | "services" | "sustainable";
export type FounderTrait = "innovation" | "negotiation" | "finance" | "marketing" | "operations" | "leadership" | "risk";

export interface FounderProfile16 {
  traits: Record<FounderTrait, number>;
  riskTolerance: "low" | "medium" | "high";
}

export interface BusinessArchetype16 {
  id: Phase16Archetype;
  label: string;
  description: string;
  priceMultiplier: number;
  qualityMultiplier: number;
  demandMultiplier: number;
  fixedCostMultiplier: number;
  startingInventory: number;
  startingReputation: number;
}

export interface WorldProfile16 {
  seed: number;
  difficulty: Phase16Difficulty;
  archetype: BusinessArchetype16;
  marketGrowth: number;
  inflation: number;
  customerPriceSensitivity: number;
  supplyReliability: number;
  competitorStrength: number;
  eventVolatility: number;
  trend: "growing" | "stable" | "declining";
}

export interface Phase16Run {
  version: 1;
  seed: number;
  difficulty: Phase16Difficulty;
  world: WorldProfile16;
  founder: FounderProfile16;
  state: SimulationState;
  decisions: Array<{ day: number; id: string; label: string }>;
  counterfactuals: Array<{ day: number; decisionId: string; alternativeId: string; actualScore: number; alternativeScore: number }>;
}

export interface Phase16RunAssessment {
  score: number;
  financial: number;
  customers: number;
  operations: number;
  strategy: number;
  resilience: number;
  learning: number;
  founderStyle: string;
  strengths: string[];
  lessons: string[];
}

const ARCHETYPES: Record<Phase16Archetype, BusinessArchetype16> = {
  tech_startup: { id: "tech_startup", label: "Tech Startup", description: "Innovation-led growth with high uncertainty and strong upside.", priceMultiplier: 1.12, qualityMultiplier: 1.08, demandMultiplier: 1.1, fixedCostMultiplier: 1.15, startingInventory: 16, startingReputation: 48 },
  retail: { id: "retail", label: "Retail", description: "Customer-volume business where pricing, stock and service matter.", priceMultiplier: 0.96, qualityMultiplier: 0.98, demandMultiplier: 1.12, fixedCostMultiplier: 1.1, startingInventory: 34, startingReputation: 52 },
  food: { id: "food", label: "Food Business", description: "Fast-moving demand with tight margins and reputation sensitivity.", priceMultiplier: 0.9, qualityMultiplier: 1.03, demandMultiplier: 1.18, fixedCostMultiplier: 1.08, startingInventory: 40, startingReputation: 54 },
  manufacturing: { id: "manufacturing", label: "Manufacturing", description: "Capacity, procurement and operational efficiency drive the outcome.", priceMultiplier: 1.08, qualityMultiplier: 1.02, demandMultiplier: 0.95, fixedCostMultiplier: 1.28, startingInventory: 48, startingReputation: 50 },
  ecommerce: { id: "ecommerce", label: "E-commerce", description: "Digital acquisition and price competition create scalable growth.", priceMultiplier: 1.02, qualityMultiplier: 1, demandMultiplier: 1.16, fixedCostMultiplier: 1.05, startingInventory: 30, startingReputation: 49 },
  saas: { id: "saas", label: "SaaS", description: "Recurring-revenue economics reward retention and product quality.", priceMultiplier: 1.2, qualityMultiplier: 1.1, demandMultiplier: 0.92, fixedCostMultiplier: 1.18, startingInventory: 8, startingReputation: 47 },
  services: { id: "services", label: "Services", description: "People, reputation and delivery quality drive recurring demand.", priceMultiplier: 1.04, qualityMultiplier: 1.06, demandMultiplier: 1, fixedCostMultiplier: 1.02, startingInventory: 12, startingReputation: 55 },
  sustainable: { id: "sustainable", label: "Sustainable Business", description: "Purpose-led differentiation trades some short-term margin for long-term trust.", priceMultiplier: 1.1, qualityMultiplier: 1.05, demandMultiplier: 1.04, fixedCostMultiplier: 1.12, startingInventory: 24, startingReputation: 62 },
};

const DIFFICULTY: Record<Phase16Difficulty, Omit<WorldProfile16, "seed" | "difficulty" | "archetype" | "trend">> = {
  beginner: { marketGrowth: 5, inflation: 1, customerPriceSensitivity: 38, supplyReliability: 88, competitorStrength: 35, eventVolatility: 20 },
  standard: { marketGrowth: 2, inflation: 2.5, customerPriceSensitivity: 50, supplyReliability: 80, competitorStrength: 50, eventVolatility: 35 },
  advanced: { marketGrowth: 0, inflation: 4, customerPriceSensitivity: 62, supplyReliability: 72, competitorStrength: 65, eventVolatility: 50 },
  expert: { marketGrowth: -2, inflation: 6, customerPriceSensitivity: 72, supplyReliability: 64, competitorStrength: 78, eventVolatility: 68 },
  founder: { marketGrowth: -4, inflation: 8, customerPriceSensitivity: 80, supplyReliability: 55, competitorStrength: 90, eventVolatility: 82 },
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value * 100) / 100;

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
  return hash >>> 0;
}

function rng(seed: number, salt: number): number {
  let x = (seed ^ Math.imul(salt + 1, 0x9e3779b9)) >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return ((x >>> 0) % 1_000_000) / 1_000_000;
}

export function getPhase16Archetypes(): BusinessArchetype16[] { return Object.values(ARCHETYPES); }

export function createPhase16World(seedInput: number | string, difficulty: Phase16Difficulty, archetype: Phase16Archetype): WorldProfile16 {
  const seed = typeof seedInput === "number" ? Math.abs(Math.floor(seedInput)) >>> 0 : hashSeed(seedInput);
  const base = DIFFICULTY[difficulty];
  const archetypeData = ARCHETYPES[archetype];
  const marketGrowth = round(base.marketGrowth + (rng(seed, 1) - 0.5) * 6);
  const trend: WorldProfile16["trend"] = marketGrowth > 2 ? "growing" : marketGrowth < -2 ? "declining" : "stable";
  return {
    seed, difficulty, archetype: archetypeData, trend,
    marketGrowth, inflation: round(base.inflation + rng(seed, 2) * 2),
    customerPriceSensitivity: round(clamp(base.customerPriceSensitivity + (rng(seed, 3) - 0.5) * 10)),
    supplyReliability: round(clamp(base.supplyReliability + (rng(seed, 4) - 0.5) * 8)),
    competitorStrength: round(clamp(base.competitorStrength + (rng(seed, 5) - 0.5) * 10)),
    eventVolatility: round(clamp(base.eventVolatility + (rng(seed, 6) - 0.5) * 10)),
  };
}

export function createFounderProfile16(seed: number, traits?: Partial<Record<FounderTrait, number>>): FounderProfile16 {
  const names: FounderTrait[] = ["innovation", "negotiation", "finance", "marketing", "operations", "leadership", "risk"];
  const values = Object.fromEntries(names.map((trait, index) => [trait, clamp(traits?.[trait] ?? Math.round(42 + rng(seed, 20 + index) * 46))])) as Record<FounderTrait, number>;
  const riskTolerance = values.risk >= 67 ? "high" : values.risk <= 40 ? "low" : "medium";
  return { traits: values, riskTolerance };
}

function applyArchetype(state: SimulationState, world: WorldProfile16): SimulationState {
  const a = world.archetype;
  const operations = state.operations ? {
    ...state.operations,
    price: round(state.operations.price * a.priceMultiplier),
    quality: clamp(state.operations.quality * a.qualityMultiplier),
    productionCapacity: Math.max(1, Math.round(state.operations.productionCapacity * (a.id === "manufacturing" ? 1.25 : 1))),
    supplierUnitCost: round(state.operations.supplierUnitCost * (1 + (world.inflation - 2) / 100)),
  } : state.operations;
  const market = state.market ? {
    ...state.market,
    demandIndex: Math.max(1, round(state.market.demandIndex * a.demandMultiplier + world.marketGrowth)),
    competitivePressure: clamp(state.market.competitivePressure + world.competitorStrength * 0.2),
    confidence: clamp(state.market.confidence + world.marketGrowth),
    trend: world.trend,
  } : state.market;
  const business = {
    ...state.business,
    cash: Math.max(0, round(state.business.cash / (a.fixedCostMultiplier * (1 + world.inflation / 200)))),
    inventory: a.startingInventory,
    reputation: a.startingReputation,
  };
  const economy = state.economy ? { ...state.economy, products: state.economy.products.map((p, index) => index === 0 ? { ...p, sellingPrice: operations?.price ?? p.sellingPrice, quality: operations?.quality ?? p.quality, inventory: a.startingInventory } : p) } : state.economy;
  return { ...state, business, operations, market, economy, log: [...state.log, `Phase 16 world: ${a.label} · ${world.trend} market · ${world.difficulty} difficulty · seed ${world.seed}.`] };
}

function phase16Event(run: Phase16Run): SimulationEvent {
  const day = run.state.business.day;
  const roll = rng(run.seed, day * 17);
  const world = run.world;
  if (roll < 0.25) return { id: `p16-demand-${day}`, day, title: "Demand signal", message: `Market demand is ${world.trend}. Customer price sensitivity is ${Math.round(world.customerPriceSensitivity)}%.`, choices: [
    { id: "invest-demand", label: "Invest in acquisition", effects: { cash: -900, revenue: 1_600, customers: 3, reputation: 1 } },
    { id: "protect-margin", label: "Protect cash and margin", effects: { cash: 250, revenue: 500, reputation: 1 } },
    { id: "test-premium", label: "Test premium pricing", effects: { revenue: 1_300, reputation: -1, customers: -1 } },
  ] };
  if (roll < 0.5) return { id: `p16-supply-${day}`, day, title: "Supply negotiation", message: `Supplier reliability is ${Math.round(world.supplyReliability)}%. A contract decision could reduce future disruption risk.`, choices: [
    { id: "lock-contract", label: "Lock a reliable contract", effects: { cash: -700, reputation: 1, supplierRelationship: 6 } },
    { id: "negotiate-hard", label: "Push for a lower price", effects: { cash: 200, supplierRelationship: -5 } },
    { id: "diversify", label: "Diversify suppliers", effects: { cash: -450, supplierRelationship: 2, inventory: 8 } },
  ] };
  if (roll < 0.75) return { id: `p16-competitor-${day}`, day, title: "Competitive pressure", message: `Competitor strength is ${Math.round(world.competitorStrength)}%. Your response shapes market share.`, choices: [
    { id: "differentiate", label: "Differentiate on quality", effects: { cash: -500, revenue: 1_000, reputation: 4, marketShare: 1 } },
    { id: "match-price", label: "Match the market price", effects: { cash: -300, revenue: 1_300, marketShare: 1.2 } },
    { id: "focus-niche", label: "Own a niche", effects: { revenue: 700, reputation: 3, marketShare: 0.8 } },
  ] };
  return { id: `p16-resilience-${day}`, day, title: "Resilience decision", message: `Event volatility is ${Math.round(world.eventVolatility)}%. Build resilience now or accept short-term efficiency.`, choices: [
    { id: "build-buffer", label: "Build a cash and stock buffer", effects: { cash: -650, inventory: 15, reputation: 1 } },
    { id: "stay-lean", label: "Stay lean", effects: { cash: 500, inventory: -6 } },
    { id: "train-team", label: "Invest in the team", effects: { cash: -800, reputation: 3, customers: 2 } },
  ] };
}

function traitMultiplier(profile: FounderProfile16, choice: SimulationChoice): number {
  const text = `${choice.id} ${choice.label}`.toLowerCase();
  const relevant: FounderTrait[] = text.includes("quality") || text.includes("innovation") ? ["innovation"] : text.includes("supplier") || text.includes("negotiate") || text.includes("contract") ? ["negotiation"] : text.includes("cash") || text.includes("margin") || text.includes("price") ? ["finance"] : text.includes("customer") || text.includes("acquisition") || text.includes("niche") ? ["marketing"] : text.includes("team") || text.includes("train") ? ["leadership", "operations"] : ["risk"];
  const average = relevant.reduce((sum, trait) => sum + profile.traits[trait], 0) / relevant.length;
  return 0.9 + (average - 50) / 500;
}

function scoreState(state: SimulationState): number {
  const cash = clamp(state.business.cash / 1000, 0, 100);
  const revenue = clamp(state.business.revenue / 2500, 0, 100);
  const reputation = clamp(state.business.reputation);
  const share = clamp(state.business.marketShare * 4);
  const satisfaction = clamp(state.operations?.customerSatisfaction ?? 50);
  const finance = state.financials ? clamp((state.financials.netProfit + state.financials.cash) / 500) : 50;
  return round(cash * 0.2 + revenue * 0.15 + reputation * 0.2 + share * 0.15 + satisfaction * 0.15 + finance * 0.15);
}

export function createPhase16Run(input: { name: string; idea: string; industry: string; structure: BusinessStructure; founderNames: string[]; seed?: number | string; difficulty?: Phase16Difficulty; archetype?: Phase16Archetype; founderTraits?: Partial<Record<FounderTrait, number>> }): Phase16Run {
  const seed = typeof input.seed === "undefined" ? hashSeed(`${input.name}|${input.idea}|${input.industry}`) : typeof input.seed === "number" ? Math.abs(Math.floor(input.seed)) >>> 0 : hashSeed(input.seed);
  const difficulty = input.difficulty ?? "standard";
  const archetype = input.archetype ?? "tech_startup";
  const world = createPhase16World(seed, difficulty, archetype);
  const founder = createFounderProfile16(seed, input.founderTraits);
  const base = createBusiness(input);
  const state = applyArchetype(base, world);
  return { version: 1, seed, difficulty, world, founder, state: { ...state, events: [phase16Event({ version: 1, seed, difficulty, world, founder, state, decisions: [], counterfactuals: [] })] }, decisions: [], counterfactuals: [] };
}

export function advancePhase16Day(run: Phase16Run): Phase16Run {
  const nextState = advanceDay(run.state);
  const pressure = run.world.competitorStrength / 100;
  const market = nextState.market ? { ...nextState.market, demandIndex: Math.max(1, nextState.market.demandIndex + run.world.marketGrowth), competitivePressure: clamp(nextState.market.competitivePressure + pressure * 2) } : nextState.market;
  const adjusted = { ...nextState, market };
  const nextRun = { ...run, state: adjusted, decisions: [...run.decisions] };
  return { ...nextRun, state: { ...adjusted, events: [phase16Event(nextRun)] } };
}

export function applyPhase16Decision(run: Phase16Run, decision: SimulationChoice): Phase16Run {
  const multiplier = traitMultiplier(run.founder, decision);
  const effects = Object.fromEntries(Object.entries(decision.effects).map(([key, value]) => [key, round(value * multiplier)]));
  const adjustedDecision = { ...decision, effects };
  const nextState = applyChoice(run.state, adjustedDecision);
  const decisionRecord = { day: run.state.business.day, id: decision.id, label: decision.label };
  return { ...run, state: { ...nextState, events: [] }, decisions: [...run.decisions, decisionRecord].slice(-200) };
}

export function simulatePhase16Alternative(run: Phase16Run, alternative: SimulationChoice): { score: number; state: SimulationState } {
  const multiplier = traitMultiplier(run.founder, alternative);
  const effects = Object.fromEntries(Object.entries(alternative.effects).map(([key, value]) => [key, round(value * multiplier)]));
  const state = applyChoice(run.state, { ...alternative, effects });
  return { score: scoreState(state), state };
}

export function recordPhase16Counterfactual(run: Phase16Run, actualDecision: SimulationChoice, alternative: SimulationChoice): Phase16Run {
  const actualScore = scoreState(applyChoice(run.state, { ...actualDecision, effects: Object.fromEntries(Object.entries(actualDecision.effects).map(([key, value]) => [key, round(value * traitMultiplier(run.founder, actualDecision))])) }));
  const alternativeResult = simulatePhase16Alternative(run, alternative);
  return { ...run, counterfactuals: [...run.counterfactuals, { day: run.state.business.day, decisionId: actualDecision.id, alternativeId: alternative.id, actualScore, alternativeScore: alternativeResult.score }].slice(-100) };
}

export function assessPhase16Run(run: Phase16Run): Phase16RunAssessment {
  const state = run.state;
  const financial = clamp(((state.financials?.netProfit ?? 0) + Math.max(0, state.business.cash)) / 700);
  const customers = clamp((state.business.customers.length * 8) + (state.operations?.customerSatisfaction ?? 50) * 0.5);
  const operations = clamp((state.operations?.quality ?? 50) * 0.45 + (state.operations?.brandAwareness ?? 50) * 0.25 + (state.workforce?.productivityIndex ?? 50) * 0.3);
  const strategy = clamp((state.business.reputation * 0.35) + (state.business.marketShare * 2.5) + ((state.market?.strategyScore ?? 50) * 0.3));
  const resilience = clamp((state.market?.confidence ?? 50) * 0.35 + (state.agents?.suppliers.reduce((sum, supplier) => sum + supplier.reliability, 0) ?? 0) / Math.max(1, state.agents?.suppliers.length ?? 1) * 0.35 + (state.financials?.runwayDays ?? 0) * 0.3);
  const learning = clamp(50 + run.decisions.length * 2 + run.counterfactuals.length * 4);
  const score = round(financial * 0.2 + customers * 0.15 + operations * 0.15 + strategy * 0.2 + resilience * 0.15 + learning * 0.15);
  const strengths = [
    ["Financial discipline", financial], ["Customer thinking", customers], ["Operational execution", operations], ["Strategic positioning", strategy], ["Resilience", resilience],
  ].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([label]) => label);
  const lessons = [
    financial < 50 ? "Protect cash before chasing growth." : "Your cash discipline is supporting strategic flexibility.",
    customers < 50 ? "Customer retention and value should guide the next decision." : "Customer outcomes are translating into stronger business health.",
    resilience < 50 ? "Build buffers before the next disruption." : "You are building a business that can absorb shocks.",
  ];
  const traits = run.founder.traits;
  const sortedTraits = (Object.entries(traits) as Array<[FounderTrait, number]>).sort((a, b) => b[1] - a[1]);
  const founderStyle = `${sortedTraits[0][0][0].toUpperCase()}${sortedTraits[0][0].slice(1)}-First Founder`;
  return { score, financial: round(financial), customers: round(customers), operations: round(operations), strategy: round(strategy), resilience: round(resilience), learning: round(learning), founderStyle, strengths, lessons };
}

export function phase16RunToSaveData(run: Phase16Run): string { return JSON.stringify(run); }
export function phase16RunFromSaveData(value: string): Phase16Run {
  const parsed = JSON.parse(value) as Phase16Run;
  if (parsed.version !== 1 || !parsed.state?.business || !parsed.world?.archetype) throw new Error("Invalid EnterpriseVerse Phase 16 save data.");
  return parsed;
}
