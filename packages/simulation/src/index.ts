import type {
  Business,
  BusinessStructure,
  Customer,
  SimulationChoice,
  SimulationEvent,
  SimulationState,
  Supplier,
} from "@enterpriseverse/types";

export {
  createCustomerAgents,
  createSupplierAgents,
  createCompetitorAgents,
  createInvestorAgents,
  decideCustomerPurchase,
  negotiateSupplier,
  decideCompetitorMove,
  evaluateInvestment,
} from "./agents";

const STARTING_CASH: Record<BusinessStructure, number> = {
  sole_trader: 20_000,
  partnership: 35_000,
  trio: 50_000,
  team: 75_000,
};

const STRUCTURE_EXPENSE: Record<BusinessStructure, number> = {
  sole_trader: 450,
  partnership: 700,
  trio: 1_050,
  team: 1_500,
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const choice = (id: string, label: string, effects: Record<string, number>): SimulationChoice => ({ id, label, effects });

function starterCustomers(): Customer[] {
  return [
    { id: "customer-1", name: "Aarav", segment: "standard", trust: 60, lifetimeValue: 0 },
    { id: "customer-2", name: "Mira", segment: "premium", trust: 72, lifetimeValue: 0 },
    { id: "customer-3", name: "Kabir", segment: "budget", trust: 52, lifetimeValue: 0 },
  ];
}

function starterSuppliers(): Supplier[] {
  return [
    { id: "supplier-1", name: "Prime Supplies", reliability: 86, unitCost: 60, relationship: 60, availableUnits: 100 },
    { id: "supplier-2", name: "Value Wholesale", reliability: 68, unitCost: 48, relationship: 45, availableUnits: 80 },
  ];
}

function generateEvent(day: number, business: Business): SimulationEvent {
  const cycle = day % 5;
  if (cycle === 1) {
    return { id: `event-${day}`, day, title: "Supplier price increase", message: "Your main supplier says input costs will rise by 12%. Decide how to protect your margin.", choices: [choice("accept", "Accept the increase", { cash: -900, reputation: 1, inventory: 12 }), choice("negotiate", "Negotiate a smaller increase", { cash: -450, reputation: 2, supplierRelationship: 4, inventory: 10 }), choice("switch", "Find another supplier", { cash: -250, reputation: -1, supplierRelationship: -6, inventory: 5 })] };
  }
  if (cycle === 2) {
    return { id: `event-${day}`, day, title: "Customer demand spike", message: "A local trend is driving extra demand. You can invest in stock or protect your cash.", choices: [choice("stock", "Buy extra inventory", { cash: -1_200, revenue: 2_400, reputation: 1, inventory: 30, customers: 5 }), choice("normal", "Keep operations unchanged", { revenue: 800, customers: 2, inventory: -8 }), choice("premium", "Raise prices and test demand", { revenue: 1_400, reputation: -1, customers: 1, inventory: -6 })] };
  }
  if (cycle === 3) {
    return { id: `event-${day}`, day, title: "Customer complaint", message: "A visible customer says their order was late. Your response will affect trust and reputation.", choices: [choice("refund", "Refund and apologize", { cash: -300, reputation: 3, customerTrust: 6 }), choice("replace", "Replace the order", { cash: -180, reputation: 2, customerTrust: 4 }), choice("defend", "Refuse compensation", { reputation: -4, customerTrust: -8 })] };
  }
  if (cycle === 4) {
    return { id: `event-${day}`, day, title: "Competitor move", message: "A nearby competitor has launched a discount campaign. You must decide whether to react.", choices: [choice("match", "Match their discount", { cash: -500, revenue: 1_500, reputation: 1, customers: 3 }), choice("differentiate", "Differentiate on quality", { revenue: 1_100, reputation: 3, customers: 2 }), choice("ignore", "Ignore the campaign", { revenue: 500, reputation: -1 })] };
  }
  return { id: `event-${day}`, day, title: "Investor introduction", message: `${business.name} has attracted attention. An investor wants a short meeting. Decide whether to pursue growth capital.`, choices: [choice("pitch", "Prepare a growth pitch", { cash: 10_000, reputation: 3, marketShare: 2 }), choice("decline", "Focus on customers instead", { revenue: 600, reputation: 1 })] };
}

export function createBusiness(input: { name: string; structure: BusinessStructure; founderNames: string[] }): SimulationState {
  const startingCash = STARTING_CASH[input.structure];
  const founders = input.founderNames.map((name, index) => ({ id: `founder-${index + 1}`, name, cash: Math.round(startingCash / Math.max(1, input.founderNames.length)), reputation: 50 }));
  const business: Business = {
    id: `business-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: input.name,
    structure: input.structure,
    founders,
    cash: startingCash,
    revenue: 0,
    expenses: 0,
    reputation: 50,
    day: 1,
    status: "active",
    inventory: 20,
    customers: starterCustomers(),
    suppliers: starterSuppliers(),
    marketShare: 1,
  };
  return { business, events: [generateEvent(1, business)], log: [`Day 1: ${business.name} opened for business with ₹${startingCash.toLocaleString("en-IN")} starting capital.`] };
}

export function advanceDay(state: SimulationState): SimulationState {
  const { business } = state;
  const fixedExpense = STRUCTURE_EXPENSE[business.structure];
  const baseDemand = 7 + ((business.day * 13) % 14);
  const unitsSold = Math.min(business.inventory, baseDemand);
  const pricePerUnit = 120;
  const revenue = unitsSold * pricePerUnit;
  const nextInventory = business.inventory - unitsSold;
  const nextCustomers = business.customers.map((customer, index) => index < Math.min(unitsSold, business.customers.length) ? { ...customer, lastPurchaseDay: business.day + 1, lifetimeValue: customer.lifetimeValue + pricePerUnit } : customer);
  const nextBusiness: Business = { ...business, day: business.day + 1, revenue: business.revenue + revenue, expenses: business.expenses + fixedExpense, cash: business.cash + revenue - fixedExpense, inventory: nextInventory, customers: nextCustomers, reputation: clamp(business.reputation + (unitsSold >= baseDemand ? 1 : -1)), marketShare: clamp(business.marketShare + (unitsSold >= baseDemand ? 0.2 : -0.1)) };
  return { business: nextBusiness, events: [generateEvent(nextBusiness.day, nextBusiness)], log: [...state.log, `Day ${nextBusiness.day}: sold ${unitsSold} units for ₹${revenue.toLocaleString("en-IN")}; operating costs were ₹${fixedExpense.toLocaleString("en-IN")}.`] };
}

export function applyChoice(state: SimulationState, selected: SimulationChoice): SimulationState {
  const business = state.business;
  const effects = selected.effects;
  const customers = effects.customerTrust ? business.customers.map((customer, index) => index === 0 ? { ...customer, trust: clamp(customer.trust + effects.customerTrust) } : customer) : business.customers;
  const suppliers = effects.supplierRelationship ? business.suppliers.map((supplier, index) => index === 0 ? { ...supplier, relationship: clamp(supplier.relationship + effects.supplierRelationship) } : supplier) : business.suppliers;
  const nextBusiness: Business = { ...business, cash: Math.max(0, business.cash + (effects.cash ?? 0)), revenue: business.revenue + (effects.revenue ?? 0), reputation: clamp(business.reputation + (effects.reputation ?? 0)), inventory: Math.max(0, business.inventory + (effects.inventory ?? 0)), customers, suppliers, marketShare: clamp(business.marketShare + (effects.marketShare ?? 0)) };
  return { business: nextBusiness, events: [], log: [...state.log, `Day ${business.day}: chose “${selected.label}”.`] };
}
