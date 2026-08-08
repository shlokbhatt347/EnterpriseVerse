import type { Business, BusinessStructure, SimulationChoice, SimulationEvent, SimulationState } from "@enterpriseverse/types";

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

const choice = (id: string, label: string, effects: Record<string, number>): SimulationChoice => ({ id, label, effects });

function generateEvent(day: number, business: Business): SimulationEvent {
  const cycle = day % 4;
  if (cycle === 1) {
    return {
      id: `event-${day}`,
      day,
      title: "Supplier price increase",
      message: "Your main supplier says input costs will rise by 12%. Decide how to respond.",
      choices: [
        choice("accept", "Accept the increase", { cash: -900, reputation: 1 }),
        choice("negotiate", "Negotiate a smaller increase", { cash: -400, reputation: 2 }),
        choice("switch", "Find another supplier", { cash: -250, reputation: -1 }),
      ],
    };
  }
  if (cycle === 2) {
    return {
      id: `event-${day}`,
      day,
      title: "Customer demand spike",
      message: "A local trend is driving extra demand. You can capitalize on it or protect your cash.",
      choices: [
        choice("stock", "Buy extra inventory", { cash: -1_200, revenue: 2_400, reputation: 1 }),
        choice("normal", "Keep operations unchanged", { revenue: 800, reputation: 0 }),
        choice("premium", "Raise prices and test demand", { revenue: 1_400, reputation: -1 }),
      ],
    };
  }
  if (cycle === 3) {
    return {
      id: `event-${day}`,
      day,
      title: "Customer complaint",
      message: "A visible customer says their order was late. Your response will affect trust.",
      choices: [
        choice("refund", "Refund and apologize", { cash: -300, reputation: 3 }),
        choice("replace", "Replace the order", { cash: -180, reputation: 2 }),
        choice("defend", "Explain the delay and refuse compensation", { reputation: -4 }),
      ],
    };
  }
  return {
    id: `event-${day}`,
    day,
    title: "Investor introduction",
    message: `${business.name} has attracted attention. An investor wants a short meeting tomorrow. Prepare your case.",
    choices: [
      choice("pitch", "Prepare a growth pitch", { reputation: 2 }),
      choice("decline", "Focus on customers instead", { revenue: 600, reputation: 1 }),
    ],
  };
}

export function createBusiness(input: {
  name: string;
  structure: BusinessStructure;
  founderNames: string[];
}): SimulationState {
  const founders = input.founderNames.map((name, index) => ({
    id: `founder-${index + 1}`,
    name,
    cash: Math.round(STARTING_CASH[input.structure] / Math.max(1, input.founderNames.length)),
    reputation: 50,
  }));
  const business: Business = {
    id: crypto.randomUUID(),
    name: input.name,
    structure: input.structure,
    founders,
    cash: STARTING_CASH[input.structure],
    revenue: 0,
    expenses: 0,
    reputation: 50,
    day: 1,
    status: "active",
  };
  return { business, events: [generateEvent(1, business)], log: [`Day 1: ${business.name} opened for business.`] };
}

export function advanceDay(state: SimulationState): SimulationState {
  const { business } = state;
  const fixedExpense = STRUCTURE_EXPENSE[business.structure];
  const demand = 700 + Math.floor(Math.random() * 1_001);
  const nextBusiness: Business = {
    ...business,
    day: business.day + 1,
    revenue: business.revenue + demand,
    expenses: business.expenses + fixedExpense,
    cash: business.cash + demand - fixedExpense,
    reputation: Math.max(0, Math.min(100, business.reputation + (demand > 1_300 ? 1 : 0))),
  };
  return {
    business: nextBusiness,
    events: [generateEvent(nextBusiness.day, nextBusiness)],
    log: [...state.log, `Day ${nextBusiness.day}: sales ${demand}, operating costs ${fixedExpense}.`],
  };
}

export function applyChoice(state: SimulationState, selected: SimulationChoice): SimulationState {
  const effects = selected.effects;
  const business = state.business;
  const nextBusiness: Business = {
    ...business,
    cash: business.cash + (effects.cash ?? 0),
    revenue: business.revenue + (effects.revenue ?? 0),
    reputation: Math.max(0, Math.min(100, business.reputation + (effects.reputation ?? 0))),
  };
  return {
    business: nextBusiness,
    events: [],
    log: [...state.log, `Day ${business.day}: chose “${selected.label}”.`],
  };
}
