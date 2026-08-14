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
]; }
function starterEconomy(): EconomyState { return createEconomyState([createProduct({ name: "Core Product", category: "starter", sellingPrice: 120, productionCost: 60, quality: 70, demandScore: 65, inventory: 20 })]); }
function updateMemory(memories: CharacterMemory[], memory: CharacterMemory): CharacterMemory[] { return [...memories, memory].slice(-8); }

function generateEvent(day: number, business: Business): SimulationEvent {
  const cycle = day % 5;
  if (cycle === 1) return { id: `event-${day}`, day, title: "Supplier price increase", message: "Your main supplier says input costs will rise by 12%. Decide how to protect your margin.", choices: [choice("accept", "Accept the increase", { cash: -900, reputation: 1, inventory: 12 }), choice("negotiate", "Negotiate a smaller increase", { cash: -450, reputation: 2, supplierRelationship: 4, inventory: 10 }), choice("switch", "Find another supplier", { cash: -250, reputation: -1, supplierRelationship: -6, inventory: 5 })] };
  if (cycle === 2) return { id: `event-${day}`, day, title: "Customer demand spike", message: "A local trend is driving extra demand. You can invest in stock or protect your cash.", choices: [choice("stock", "Buy extra inventory", { cash: -1_200, revenue: 2_400, reputation: 1, inventory: 30, customers: 5 }), choice("normal", "Keep operations unchanged", { revenue: 800, customers: 2, inventory: -8 }), choice("premium", "Raise prices and test demand", { revenue: 1_400, reputation: -1, customers: 1, inventory: -6 })] };
  if (cycle === 3) return { id: `event-${day}`, day, title: "Customer complaint", message: "A visible customer says their order was late. Your response will affect trust and reputation.", choices: [choice("refund", "Refund and apologize", { cash: -300, reputation: 3, customerTrust: 6 }), choice("replace", "Replace the order", { cash: -180, reputation: 2, customerTrust: 4 }), choice("defend", "Refuse compensation", { reputation: -4, customerTrust: -8 })] };
  if (cycle === 4) return { id: `event-${day}`, day, title: "Competitor move", message: "A nearby competitor has launched a discount campaign. You must decide whether to react.", choices: [choice("match", "Match their discount", { cash: -500, revenue: 1_500, reputation: 1, customers: 3 }), choice("differentiate", "Differentiate on quality", { revenue: 1_100, reputation: 3, customers: 2 }), choice("ignore", "Ignore the campaign", { revenue: 500, reputation: -1 })] };
  return { id: `event-${day}`, day, title: "Investor introduction", message: `${business.name} has attracted attention. An investor wants a short meeting. Decide whether to pursue growth capital.`, choices: [choice("pitch", "Prepare a growth pitch", { cash: 10_000, reputation: 3, marketShare: 2 }), choice("decline", "Focus on customers instead", { revenue: 600, reputation: 1 })] };
}

function runAgentRound(state: SimulationState): SimulationState {
  const business = state.business; const operations = state.operations ?? defaultOperations();
  const world = state.agents ?? { customers: createCustomerAgents(), suppliers: createSupplierAgents(), competitors: createCompetitorAgents(), investors: createInvestorAgents(), lastDecisions: [] };
  const decisions = [] as typeof world.lastDecisions; let customerSignal = 0; let competitorPressure = 0;
  const customers = world.customers.map((agent) => { const decision = decideCustomerPurchase(agent, business, operations.price); decisions.push(decision); const purchased = decision.action === "purchase"; customerSignal += purchased ? 1 : -1; return { ...agent, trust: clamp(agent.trust + (purchased ? 1 : -2)), relationship: clamp(agent.relationship + (purchased ? 2 : -1)), loyalty: clamp(agent.loyalty + (purchased ? 1 : -1)), mood: purchased ? "happy" as const : "concerned" as const, memories: updateMemory(agent.memories, decision.memory) }; });
  const competitors = world.competitors.map((agent) => { const decision = decideCompetitorMove(agent, business); decisions.push(decision); competitorPressure += decision.effects.competitorPressure ?? 0; const aggressive = decision.action !== "observe"; return { ...agent, cash: Math.max(0, agent.cash - (decision.action === "discount_campaign" ? 800 : 150)), marketShare: clamp(agent.marketShare + (decision.action === "discount_campaign" ? 0.4 : 0.1)), aggression: clamp(agent.aggression + (aggressive ? 1 : -1)), memories: updateMemory(agent.memories, decision.memory) }; });
  const investors = world.investors.map((agent) => { const decision = evaluateInvestment(agent, business); decisions.push(decision); const invested = decision.action === "offer_investment"; return { ...agent, investmentCapacity: Math.max(0, agent.investmentCapacity - (decision.effects.cash ?? 0)), relationship: clamp(agent.relationship + (invested ? 5 : -1)), trust: clamp(agent.trust + (invested ? 2 : -1)), mood: invested ? "excited" as const : "neutral" as const, memories: updateMemory(agent.memories, decision.memory) }; });
  const suppliers = world.suppliers.map((agent) => ({ ...agent, memories: agent.memories.slice(-8) }));
  const customerEffect = customerSignal / Math.max(1, customers.length);
  const nextBusiness: Business = { ...business, reputation: clamp(business.reputation + customerEffect * 0.4 - competitorPressure * 0.02), marketShare: clamp(business.marketShare + customerEffect * 0.08 - competitorPressure * 0.01) };
  const market = state.market ? { ...state.market, competitivePressure: clamp(state.market.competitivePressure + competitorPressure * 0.25), strategyScore: clamp(state.market.strategyScore + customerEffect * 1.5 - competitorPressure * 0.1) } : state.market;
  return { ...state, business: nextBusiness, market, agents: { customers, suppliers, competitors, investors, lastDecisions: decisions } };
}

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
  const business = state.business; const effects = selected.effects; const customers = effects.customerTrust ? business.customers.map((customer, index) => index === 0 ? { ...customer, trust: clamp(customer.trust + effects.customerTrust) } : customer) : business.customers; const suppliers = effects.supplierRelationship ? business.suppliers.map((supplier, index) => index === 0 ? { ...supplier, relationship: clamp(supplier.relationship + effects.supplierRelationship) } : supplier) : business.suppliers; const extraCustomers = Math.max(0, Math.round(effects.customers ?? 0)); const newCustomers = Array.from({ length: extraCustomers }, (_, index): Customer => ({ id: `customer-${business.customers.length + index + 1}-d${business.day}`, name: `New Customer ${business.customers.length + index + 1}`, segment: index % 3 === 0 ? "premium" : index % 3 === 1 ? "standard" : "budget", trust: 55, lifetimeValue: 0 })); const nextBusiness: Business = { ...business, cash: Math.max(0, business.cash + (effects.cash ?? 0)), revenue: Math.max(0, business.revenue + (effects.revenue ?? 0)), reputation: clamp(business.reputation + (effects.reputation ?? 0)), inventory: Math.max(0, business.inventory + (effects.inventory ?? 0)), marketShare: clamp(business.marketShare + (effects.marketShare ?? 0)), customers: [...customers, ...newCustomers] }; const consequence = consequenceFromChoice(selected, business.day); const consequences = consequence ? scheduleConsequence(state.consequences ?? createConsequenceState(), consequence) : state.consequences; const replay = recordDecision(state.replay ?? createReplayState(1), selected.id); const outcome = scoreDecisionOutcome(selected, business, nextBusiness); return { ...state, business: nextBusiness, financials: calculateFinancialSnapshot(nextBusiness, state.operations ?? defaultOperations(), nextBusiness.inventory * 60, state.workforce?.payroll ?? 0), consequences, replay, outcomes: [...(state.outcomes ?? []), outcome], events: [generateEvent(business.day + 1, nextBusiness)], log: [...state.log, `Day ${business.day}: chose “${selected.label}”.`] };
}

export function getLifecycle(state: SimulationState) { return getLifecycleStage(state.business); }
export function getRunAssessment(state: SimulationState) { return assessRun(state); }
