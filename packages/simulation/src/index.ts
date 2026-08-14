import type { Business, BusinessStructure, CharacterMemory, Customer, EconomyState, Product, SimulationChoice, SimulationEvent, SimulationState, Supplier } from "@enterpriseverse/types";
import { defaultOperations } from "./operations";
import { advanceMarket, createMarketState, explainMarketPosition } from "./market";
import { createCompetitorAgents, createCustomerAgents, createInvestorAgents, createSupplierAgents, decideCompetitorMove, decideCustomerPurchase, evaluateInvestment, negotiateSupplier, runAgentRound } from "./agents";
import { advanceEconomyDay, createEconomyState, createProduct, starterEconomy } from "./economy";
import { getLifecycleStage } from "./lifecycle";
import { createWorkforce, advanceWorkforce } from "./workforce";
import { calculateFinancialSnapshot } from "./finance";
import { advanceConsequences, consequenceFromChoice, createConsequenceState, scheduleConsequence } from "./consequences";
import { advanceScenarios, createScenarioState } from "./scenarios";
import { createReplayState, recordDecision, recordSnapshot } from "./replay";
import { assessRun, scoreDecisionOutcome } from "./assessment";
import { generateEvent } from "./events";
import { buildAttentionSignals, buildCausalChain, buildDecisionMemory, buildNotifications, searchEnterprise, compareWave2Scenario, buildWave2Snapshot } from "./wave2";

export * from "./operations";
export * from "./market";
export * from "./agents";
export * from "./economy";
export * from "./lifecycle";
export * from "./workforce";
export * from "./finance";
export * from "./consequences";
export * from "./scenarios";
export * from "./replay";
export * from "./assessment";
export * from "./events";
export * from "./wave2";

const STARTING_CASH: Record<BusinessStructure, number> = {
  sole_trader: 10000,
  partnership: 20000,
  private_limited: 50000,
  social_enterprise: 15000,
};

const STRUCTURE_EXPENSE: Record<BusinessStructure, number> = {
  sole_trader: 250,
  partnership: 500,
  private_limited: 1200,
  social_enterprise: 350,
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

const starterCustomers = (): Customer[] => [
  { id: "customer-1", name: "Mira Shah", segment: "premium", trust: 72, lifetimeValue: 1200 },
  { id: "customer-2", name: "Arjun Mehta", segment: "standard", trust: 64, lifetimeValue: 650 },
  { id: "customer-3", name: "Sara Khan", segment: "budget", trust: 58, lifetimeValue: 320 },
];

const starterSuppliers = (): Supplier[] => [
  { id: "supplier-1", name: "Nova Materials", category: "materials", reliability: 82, relationship: 68, unitCost: 20 },
  { id: "supplier-2", name: "Metro Logistics", category: "logistics", reliability: 76, relationship: 61, unitCost: 14 },
];

export function createBusiness(input: { name: string; idea: string; industry: string; structure: BusinessStructure; founderNames: string[] }): SimulationState {
  const startingCash = STARTING_CASH[input.structure];
  const founders = input.founderNames.map((name, index) => ({ id: `founder-${index + 1}`, name, cash: Math.round(startingCash / Math.max(1, input.founderNames.length)), reputation: 50, role: index === 0 ? "ceo" as const : undefined }));
  const business: Business = { id: `business-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, name: input.name, idea: input.idea, industry: input.industry, structure: input.structure, founders, cash: startingCash, revenue: 0, expenses: 0, reputation: 50, day: 1, status: "active", inventory: 20, customers: starterCustomers(), suppliers: starterSuppliers(), marketShare: 1 };
  const operations = defaultOperations(); const workforce = createWorkforce(1); const financials = calculateFinancialSnapshot(business, operations, 20 * 60, 0); const replay = recordSnapshot(createReplayState(1), business, operations, createMarketState(), financials);
  return { business, operations, market: createMarketState(), economy: starterEconomy(), agents: { customers: createCustomerAgents(), suppliers: createSupplierAgents(), competitors: createCompetitorAgents(), investors: createInvestorAgents(), lastDecisions: [] }, workforce, financials, consequences: createConsequenceState(), scenarios: createScenarioState(1), replay, outcomes: [], events: [generateEvent(1, business)], log: [`Day 1: ${business.name} opened in ${business.industry} with the idea “${business.idea}” and ₹${startingCash.toLocaleString("en-IN")} starting capital.`] };
}

export function advanceDay(state: SimulationState): SimulationState {
  const { business } = state; const operations = state.operations ?? defaultOperations(); const previousMarket = state.market ?? createMarketState(); const market = advanceMarket(business.day + 1, business, operations, previousMarket); const scenarioResult = advanceScenarios(state.scenarios ?? createScenarioState(1), business); const consequenceResult = advanceConsequences(state.consequences ?? createConsequenceState(), business.day + 1); const fixedExpense = STRUCTURE_EXPENSE[business.structure] + operations.employees * 150; const economyBefore = state.economy ?? starterEconomy(); const synchronizedProducts: Product[] = economyBefore.products.map((product, index) => index === 0 ? { ...product, sellingPrice: operations.price, quality: operations.quality, inventory: business.inventory, demandScore: clamp(product.demandScore + operations.brandAwareness / 20) } : product); const economyResult = advanceEconomyDay({ ...economyBefore, products: synchronizedProducts }, business.day + 1, market.demandIndex, market.competitorPrice, business.suppliers); const productInventory = economyResult.economy.products.reduce((total, product) => total + product.inventory, 0); const revenue = economyResult.revenue; const unitsSold = economyResult.unitsSold; const demandFulfilled = unitsSold > 0; const nextCustomers = business.customers.map((customer, index) => index < Math.min(unitsSold, business.customers.length) ? { ...customer, lastPurchaseDay: business.day + 1, lifetimeValue: customer.lifetimeValue + operations.price } : customer); const nextOperations = { ...operations, customerSatisfaction: clamp(operations.customerSatisfaction + (demandFulfilled ? 1 : -1) + (operations.quality - 50) / 100), marketingBudget: 0 }; const nextBusiness: Business = { ...business, day: business.day + 1, revenue: business.revenue + revenue, expenses: business.expenses + fixedExpense + economyResult.procurementSpend, cash: business.cash + revenue - fixedExpense - economyResult.procurementSpend, inventory: productInventory, customers: nextCustomers, reputation: clamp(business.reputation + (demandFulfilled ? 1 : -1)), marketShare: clamp(business.marketShare + (demandFulfilled ? 0.2 : -0.1)) }; const nextWorkforce = advanceWorkforce(state.workforce ?? createWorkforce(business.day), nextOperations, nextBusiness); const financials = calculateFinancialSnapshot(nextBusiness, nextOperations, productInventory * 60, nextWorkforce.payroll); const supplyChain = economyResult.economy.supplyChain; const advanced: SimulationState = { business: nextBusiness, operations: nextOperations, market, economy: economyResult.economy, agents: state.agents, workforce: nextWorkforce, financials, consequences: consequenceResult.state, scenarios: scenarioResult.state, replay: state.replay, outcomes: state.outcomes ?? [], events: [generateEvent(nextBusiness.day, nextBusiness)], log: [...state.log, `Day ${nextBusiness.day}: sold ${unitsSold} units for ₹${revenue.toLocaleString("en-IN")}; produced ${economyResult.unitsProduced}; delivered ${economyResult.unitsDelivered}; procurement ₹${economyResult.procurementSpend.toLocaleString("en-IN")}; supply-chain risk ${economyResult.supplyChainRisk}/100; inventory ${productInventory}; raw materials ${supplyChain?.rawMaterialInventory ?? 0}; ${explainMarketPosition(nextOperations, market)}`] }; const reacted = runAgentRound(advanced); const replay = recordSnapshot(state.replay ?? createReplayState(1), reacted.business, reacted.operations, reacted.market, financials); const reactionLog = reacted.agents?.lastDecisions.slice(0, 4).map((decision) => `${decision.agentId}: ${decision.action} — ${decision.rationale}`) ?? []; const scenarioLog = scenarioResult.triggered.map((scenario) => `Scenario: ${scenario.title} — ${scenario.description}`); const consequenceLog = consequenceResult.explanations; return { ...reacted, replay, log: [...reacted.log, ...reactionLog, ...scenarioLog, ...consequenceLog] };
}

export function applyChoice(state: SimulationState, selected: SimulationChoice): SimulationState {
  const business = state.business; const effects = selected.effects ?? {}; const customers = effects.customerTrust ? business.customers.map((customer, index) => index === 0 ? { ...customer, trust: clamp(customer.trust + effects.customerTrust) } : customer) : business.customers; const suppliers = effects.supplierRelationship ? business.suppliers.map((supplier, index) => index === 0 ? { ...supplier, relationship: clamp(supplier.relationship + effects.supplierRelationship) } : supplier) : business.suppliers; const extraCustomers = Math.max(0, Math.round(effects.customers ?? 0)); const newCustomers = Array.from({ length: extraCustomers }, (_, index): Customer => ({ id: `customer-${business.customers.length + index + 1}-d${business.day}`, name: `New Customer ${business.customers.length + index + 1}`, segment: index % 3 === 0 ? "premium" : index % 3 === 1 ? "standard" : "budget", trust: 55, lifetimeValue: 0 })); const nextBusiness: Business = { ...business, cash: Math.max(0, business.cash + (effects.cash ?? 0)), revenue: Math.max(0, business.revenue + (effects.revenue ?? 0)), reputation: clamp(business.reputation + (effects.reputation ?? 0)), inventory: Math.max(0, business.inventory + (effects.inventory ?? 0)), marketShare: clamp(business.marketShare + (effects.marketShare ?? 0)), customers: [...customers, ...newCustomers], suppliers }; const consequence = consequenceFromChoice(state, selected.id, effects, 1, `Decision “${selected.label}” produced delayed consequences.`); const consequences = scheduleConsequence(state.consequences ?? createConsequenceState(), consequence); const replay = recordDecision(state.replay ?? createReplayState(1), selected.id); const outcome = scoreDecisionOutcome(selected.id, selected.label, business.day, effects); return { ...state, business: nextBusiness, financials: calculateFinancialSnapshot(nextBusiness, state.operations ?? defaultOperations(), nextBusiness.inventory * 60, state.workforce?.payroll ?? 0), consequences, replay, outcomes: [...(state.outcomes ?? []), outcome], events: [generateEvent(business.day + 1, nextBusiness)], log: [...state.log, `Day ${business.day}: chose “${selected.label}”.`] };
}

export function getLifecycle(state: SimulationState) { return getLifecycleStage(state.business); }
export function getRunAssessment(state: SimulationState) { return assessRun(state.business, state.outcomes ?? []); }
export { buildAttentionSignals, buildCausalChain, buildDecisionMemory, buildNotifications, searchEnterprise, compareWave2Scenario, buildWave2Snapshot };
