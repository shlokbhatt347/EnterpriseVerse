import {
  Business,
  DecisionResult,
  DecisionType,
  EventType,
  SimulationEvent,
  SimulationState,
} from "./types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const EVENTS: Omit<SimulationEvent, "id" | "day">[] = [
  {
    type: "supplier_price_increase",
    title: "Supplier Price Increase",
    description:
      "Your main supplier has increased input prices by 12%. Your margins are under pressure.",
    choices: [
      "accept_supplier_increase",
      "negotiate_supplier",
      "switch_supplier",
    ],
  },
  {
    type: "demand_spike",
    title: "Demand Spike",
    description:
      "A local trend has suddenly increased demand for your product.",
    choices: ["increase_inventory", "ignore_event"],
  },
  {
    type: "customer_complaint",
    title: "Customer Complaint",
    description:
      "A customer has publicly complained about their experience with your business.",
    choices: ["respond_to_complaint", "ignore_event"],
  },
  {
    type: "investor_opportunity",
    title: "Investor Opportunity",
    description:
      "An investor has noticed your growth and wants to discuss funding expansion.",
    choices: ["pursue_investment", "ignore_event"],
  },
];

export function createBusiness(input: {
  id: string;
  name: string;
  structure: Business["structure"];
  founders: Business["founders"];
  startingCapital?: number;
}): Business {
  const defaultCapital = {
    sole_trader: 20_000,
    partnership: 35_000,
    trio: 50_000,
    team: 75_000,
  }[input.structure];

  return {
    id: input.id,
    name: input.name,
    structure: input.structure,
    founders: input.founders,
    day: 1,
    cash: input.startingCapital ?? defaultCapital,
    revenue: 0,
    expenses: 0,
    reputation: 70,
    inventory: 20,
    customers: 0,
    marketShare: 0,
  };
}

export function createInitialState(business: Business): SimulationState {
  return { business, activeEvents: [], history: [] };
}

export function generateDailyEvents(day: number): SimulationEvent[] {
  const eventCount = day === 1 ? 1 : day % 3 === 0 ? 2 : 1;
  return Array.from({ length: eventCount }, (_, index) => {
    const template = EVENTS[(day + index) % EVENTS.length];
    return { ...template, id: `event-${day}-${index + 1}`, day };
  });
}

export function resolveDecision(
  state: SimulationState,
  event: SimulationEvent,
  decision: DecisionType,
): SimulationState {
  if (!event.choices.includes(decision)) {
    throw new Error(`Decision ${decision} is not available for event ${event.id}`);
  }

  const result = applyDecision(state.business, event.type, decision);
  const business = applyResult(state.business, result);

  return {
    ...state,
    business,
    activeEvents: state.activeEvents.filter((item) => item.id !== event.id),
    history: [...state.history, result],
  };
}

export function advanceDay(state: SimulationState): SimulationState {
  const business = { ...state.business, day: state.business.day + 1 };
  const activeEvents = generateDailyEvents(business.day);
  return { ...state, business, activeEvents };
}

function applyDecision(
  business: Business,
  eventType: EventType,
  decision: DecisionType,
): DecisionResult {
  switch (eventType) {
    case "supplier_price_increase":
      if (decision === "accept_supplier_increase") {
        return {
          decision,
          message: "You accepted higher supplier costs. Your inventory remains stable, but margins shrink.",
          cashDelta: -1_500,
          reputationDelta: 0,
          inventoryDelta: 5,
          revenueDelta: 0,
          expenseDelta: 1_500,
        };
      }
      if (decision === "negotiate_supplier") {
        return {
          decision,
          message: "You negotiated successfully and limited the increase.",
          cashDelta: -600,
          reputationDelta: 1,
          inventoryDelta: 5,
          revenueDelta: 0,
          expenseDelta: 600,
        };
      }
      return {
        decision,
        message: "You switched suppliers. Costs are protected, but the transition causes short-term disruption.",
        cashDelta: -400,
        reputationDelta: -1,
        inventoryDelta: -3,
        revenueDelta: 0,
        expenseDelta: 400,
      };

    case "demand_spike":
      if (decision === "increase_inventory") {
        return {
          decision,
          message: "You invested in additional inventory and captured the demand spike.",
          cashDelta: -2_000,
          reputationDelta: 2,
          inventoryDelta: 25,
          revenueDelta: 4_000,
          expenseDelta: 2_000,
        };
      }
      return {
        decision,
        message: "You ignored the spike and preserved cash, but competitors captured the demand.",
        cashDelta: 0,
        reputationDelta: -1,
        inventoryDelta: 0,
        revenueDelta: 0,
        expenseDelta: 0,
      };

    case "customer_complaint":
      if (decision === "respond_to_complaint") {
        return {
          decision,
          message: "You responded quickly and turned a complaint into a service recovery opportunity.",
          cashDelta: -150,
          reputationDelta: 4,
          inventoryDelta: 0,
          revenueDelta: 250,
          expenseDelta: 150,
        };
      }
      return {
        decision,
        message: "You ignored the complaint. The issue remains visible to other customers.",
        cashDelta: 0,
        reputationDelta: -6,
        inventoryDelta: 0,
        revenueDelta: -250,
        expenseDelta: 0,
      };

    case "investor_opportunity":
      if (decision === "pursue_investment") {
        return {
          decision,
          message: "You pursued the investor opportunity and received expansion capital.",
          cashDelta: 10_000,
          reputationDelta: 3,
          inventoryDelta: 0,
          revenueDelta: 0,
          expenseDelta: 0,
        };
      }
      return {
        decision,
        message: "You declined the investment and retained full control.",
        cashDelta: 0,
        reputationDelta: 0,
        inventoryDelta: 0,
        revenueDelta: 0,
        expenseDelta: 0,
      };

    case "market_news":
    default:
      return {
        decision,
        message: "You chose not to act on the market information.",
        cashDelta: 0,
        reputationDelta: 0,
        inventoryDelta: 0,
        revenueDelta: 0,
        expenseDelta: 0,
      };
  }
}

function applyResult(business: Business, result: DecisionResult): Business {
  return {
    ...business,
    cash: Math.max(0, business.cash + result.cashDelta),
    reputation: clamp(business.reputation + result.reputationDelta, 0, 100),
    inventory: Math.max(0, business.inventory + result.inventoryDelta),
    revenue: business.revenue + result.revenueDelta,
    expenses: business.expenses + result.expenseDelta,
  };
}
