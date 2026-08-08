import type { Business, SimulationState } from "@enterpriseverse/types";
import { decideCompetitorMove, decideCustomerPurchase, evaluateInvestment, negotiateSupplier } from "./agents";

export type DailyTurnResult = {
  state: SimulationState;
  decisions: string[];
};

/** Runs one connected market turn. The core remains deterministic for a fixed state. */
export function runDailyMarketTurn(state: SimulationState): DailyTurnResult {
  const business = state.business;
  const decisions: string[] = [];
  let revenue = 0;
  let inventory = business.inventory;
  let reputation = business.reputation;
  let cash = business.cash;

  const customers = state.agents?.customers ?? [];
  for (const customer of customers) {
    if (inventory <= 0) break;
    const decision = decideCustomerPurchase(customer, business, 120);
    decisions.push(decision.rationale);
    if (decision.action === "purchase") {
      revenue += 120;
      inventory -= 1;
    } else {
      reputation = Math.max(0, reputation - 1);
    }
  }

  const suppliers = state.agents?.suppliers ?? [];
  if (inventory < 10 && suppliers.length > 0) {
    const supplier = suppliers[0];
    const negotiation = negotiateSupplier(supplier, 20, supplier.unitCost * 0.95, business.day);
    decisions.push(negotiation.rationale);
    if (negotiation.action === "accept_offer") {
      const units = Math.min(20, supplier.capacity);
      const cost = units * negotiation.effects.unitCost;
      if (cash >= cost) {
        inventory += units;
        cash -= cost;
      }
    }
  }

  for (const competitor of state.agents?.competitors ?? []) {
    const decision = decideCompetitorMove(competitor, { ...business, inventory, reputation });
    decisions.push(decision.rationale);
    reputation = Math.max(0, Math.min(100, reputation + (decision.effects.reputation ?? 0)));
  }

  for (const investor of state.agents?.investors ?? []) {
    const decision = evaluateInvestment(investor, { ...business, revenue: business.revenue + revenue, reputation });
    decisions.push(decision.rationale);
    if (decision.action === "offer_investment") cash += decision.effects.cash ?? 0;
  }

  const nextBusiness: Business = {
    ...business,
    cash,
    revenue: business.revenue + revenue,
    inventory,
    reputation,
  };

  return {
    state: {
      ...state,
      business: nextBusiness,
      log: [...state.log, `Day ${business.day}: ${decisions.length} market-agent decisions processed.`],
    },
    decisions,
  };
}
