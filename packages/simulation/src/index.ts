import type { Business, BusinessStructure, CharacterMemory, Customer, EconomyState, Product, SimulationChoice, SimulationEvent, SimulationState, Supplier } from "@enterpriseverse/types";
import { defaultOperations } from "./operations";
import { advanceMarket, createMarketState, explainMarketPosition } from "./market";
import { createCompetitorAgents, createCustomerAgents, createInvestorAgents, createSupplierAgents, decideCompetitorMove, decideCustomerPurchase, evaluateInvestment, negotiateSupplier } from "./agents";
import { advanceEconomyDay, createEconomyState, createProduct } from "./economy";
import { getLifecycleStage } from "./lifecycle";
import { createWorkforce, advanceWorkforce } from "./workforce";
import { calculateFinancialSnapshot } from "./finance";
import { advanceConsequences, consequenceFromChoice, createConsequenceState, scheduleConsequence } from "./consequences";
import { advanceScenarios, createScenarioState } from "./scenarios";
import { createReplayState, recordDecision, recordSnapshot } from "./replay";
import { assessRun, scoreDecisionOutcome } from "./assessment";

export { createCustomerAgents, createSupplierAgents, createCompetitorAgents, createInvestorAgents, decideCustomerPurchase, negotiateSupplier, decideCompetitorMove, evaluateInvestment } from "./agents";
export { applyBusinessAction, calculateKpis, defaultOperations } from "./operations";
export { advanceMarket, createMarketState, explainMarketPosition } from "./market";
export { calculateIntegratedMetrics, validateIntegratedState } from "./integration";
export { assessLearning, scoreDecisionOutcome as scoreLearningDecision } from "./learning";
export * from "./economy";
export * from "./lifecycle";
export * from "./workforce";
export * from "./finance";
export * from "./consequences";
export * from "./scenarios";
export * from "./replay";
export * from "./assessment";
export * from "./phase4";
export * from "./phase7";
export * from "./wave2";
export type { BusinessAction } from "./operations";
export type { IntegratedMetrics } from "./integration";
export type { LearningAssessment, LearningDimension, LearningScore } from "./learning";

const STARTING_CASH: Record<BusinessStructure, number> = { sole_trader: 20_000, partnership: 35_000, trio: 50_000, team: 75_000 };
const STRUCTURE_EXPENSE: Record<BusinessStructure, number> = { sole_trader: 450, partnership: 700, trio: 1_050, team: 1_500 };
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const choice = (id: string, label: string, effects: Record<string, number>): SimulationChoice => ({ id, label, effects });

function starterCustomers(): Customer[] { return [
  { id: "customer-1", name: "Aarav", segment: "standard", trust: 60, lifetimeValue: 0 },
  { id: "customer-2", name: "Mira", segment: "premium", trust: 72, lifetimeValue: 0 },
  { id: "customer-3", name: "Kabir", segment: "budget", trust: 52, lifetimeValue: 0 },
]; }
function starterSuppliers(): Supplier[] { return [
  { id: "supplier-1", name: "Prime Supplies", reliability: 86, unitCost: 60, relationship: 60, availableUnits: 100 },
  { id: "supplier-2", name: "Value Wholesale", reliability: 68, unitCost: 48, relationship: 45, availableUnits: 80 },
] }
