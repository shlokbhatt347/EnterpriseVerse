import type { Business, BusinessEvent, Customer, SimulationState, Supplier } from "./types";

const startingCash: Record<Business["structure"], number> = {
  sole_trader: 50_000,
  partnership: 75_000,
  trio: 100_000,
  company: 150_000,
};

export function createBusiness(input: {
  name: string;
  structure: Business["structure"];
  founders: Business["founders"];
}): Business {
  return {
    id: crypto.randomUUID(),
    name: input.name,
    structure: input.structure,
    founders: input.founders,
    cash: startingCash[input.structure],
    revenue: 0,
    expenses: 0,
    reputation: 50,
    customers: 0,
    day: 1,
  };
}

export function createInitialState(business: Business): SimulationState {
  const customers: Customer[] = [
    { id: "c1", name: "Aarav", budget: 1500, trust: 55, loyalty: 45, priceSensitivity: 70 },
    { id: "c2", name: "Maya", budget: 3000, trust: 65, loyalty: 60, priceSensitivity: 35 },
    { id: "c3", name: "Kabir", budget: 1000, trust: 40, loyalty: 25, priceSensitivity: 85 },
  ];
  const suppliers: Supplier[] = [
    { id: "s1", name: "Metro Supplies", unitCost: 420, reliability: 88, relationship: 50 },
    { id: "s2", name: "GreenSource", unitCost: 470, reliability: 94, relationship: 40 },
  ];
  return {
    business,
    customers,
    suppliers,
    currentEvent: nextEvent(business.day),
    history: [`Day ${business.day}: ${business.name} opened for business.`],
  };
}

function nextEvent(day: number): BusinessEvent {
  const events: BusinessEvent[] = [
    {
      id: `supplier-${day}`,
      title: "Supplier price increase",
      description: "Your main supplier has raised input prices by 12%. What will you do?",
      type: "supplier",
      options: [
        { id: "accept", label: "Accept", description: "Keep the relationship and absorb the increase.", cashDelta: -1200, reputationDelta: 1 },
        { id: "negotiate", label: "Negotiate", description: "Try to protect your margin without losing the supplier.", cashDelta: -500, reputationDelta: 2 },
        { id: "switch", label: "Switch supplier", description: "Move to a cheaper alternative with some reliability risk.", cashDelta: -300, reputationDelta: -1 },
      ],
    },
    {
      id: `demand-${day}`,
      title: "Demand spike",
      description: "A local trend has suddenly increased demand for your product.",
      type: "customer",
      options: [
        { id: "stock", label: "Stock up", description: "Spend cash now to capture more sales.", cashDelta: -1800, reputationDelta: 4 },
        { id: "normal", label: "Keep normal stock", description: "Protect cash and accept missed sales.", cashDelta: 0, reputationDelta: 0 },
        { id: "premium", label: "Raise price", description: "Capture margin while demand is high.", cashDelta: 900, reputationDelta: -2 },
      ],
    },
    {
      id: `customer-${day}`,
      title: "Customer complaint",
      description: "A loyal customer says your service has become slower.",
      type: "operations",
      options: [
        { id: "refund", label: "Refund", description: "Protect trust at a direct cost.", cashDelta: -400, reputationDelta: 5 },
        { id: "fix", label: "Fix operations", description: "Invest in a faster process.", cashDelta: -800, reputationDelta: 7 },
        { id: "ignore", label: "Ignore", description: "Save cash but risk losing trust.", cashDelta: 0, reputationDelta: -8 },
      ],
    },
  ];
  return events[(day - 1) % events.length];
}

export function applyDecision(state: SimulationState, optionId: string): SimulationState {
  const event = state.currentEvent;
  if (!event) return state;
  const option = event.options.find((candidate) => candidate.id === optionId);
  if (!option) throw new Error(`Unknown decision: ${optionId}`);

  const nextBusiness: Business = {
    ...state.business,
    cash: state.business.cash + option.cashDelta,
    expenses: state.business.expenses + Math.max(0, -option.cashDelta),
    revenue: state.business.revenue + Math.max(0, option.cashDelta),
    reputation: Math.max(0, Math.min(100, state.business.reputation + option.reputationDelta)),
    customers: Math.max(0, state.business.customers + (option.reputationDelta >= 4 ? 2 : option.reputationDelta <= -5 ? -2 : 1)),
  };

  return {
    ...state,
    business: nextBusiness,
    currentEvent: null,
    history: [...state.history, `Day ${nextBusiness.day}: ${event.title} → ${option.label}.`],
  };
}

export function endDay(state: SimulationState): SimulationState {
  const nextDay = state.business.day + 1;
  const baseSales = Math.max(250, Math.round(state.business.customers * 55 + state.business.reputation * 8));
  const operatingCost = 300 + state.business.founders.length * 100;
  const nextBusiness: Business = {
    ...state.business,
    day: nextDay,
    revenue: state.business.revenue + baseSales,
    expenses: state.business.expenses + operatingCost,
    cash: state.business.cash + baseSales - operatingCost,
  };
  return {
    ...state,
    business: nextBusiness,
    currentEvent: nextEvent(nextDay),
    history: [...state.history, `Day ${nextDay}: ${baseSales} in sales and ${operatingCost} in operating costs.`],
  };
}
