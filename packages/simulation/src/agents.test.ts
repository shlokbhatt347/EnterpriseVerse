import { describe, expect, it } from "vitest";
import type { Business } from "@enterpriseverse/types";
import {
  createCompetitorAgents,
  createCustomerAgents,
  createInvestorAgents,
  createSupplierAgents,
  decideCompetitorMove,
  decideCustomerPurchase,
  evaluateInvestment,
  negotiateSupplier,
} from "./agents";

const business: Business = {
  id: "business-test",
  name: "TestCo",
  idea: "A practical test business",
  industry: "Technology",
  structure: "sole_trader",
  founders: [{ id: "founder-1", name: "Test Founder", cash: 20_000, reputation: 50 }],
  cash: 30_000,
  revenue: 15_000,
  expenses: 8_000,
  reputation: 80,
  day: 4,
  status: "active",
  inventory: 20,
  customers: [],
  suppliers: [],
  marketShare: 8,
};

describe("AI character engine", () => {
  it("creates persistent agents with different motivations", () => {
    const customers = createCustomerAgents();
    expect(customers).toHaveLength(3);
    expect(new Set(customers.map((customer) => customer.priceSensitivity)).size).toBeGreaterThan(1);
    expect(createSupplierAgents()[0].negotiationFlexibility).not.toBe(createSupplierAgents()[1].negotiationFlexibility);
  });

  it("makes a customer purchase decision from business conditions", () => {
    const customer = createCustomerAgents()[1];
    const decision = decideCustomerPurchase(customer, business, 100);
    expect(decision.action).toBe("purchase");
    expect(decision.memory.day).toBe(4);
    expect(decision.rationale.length).toBeGreaterThan(10);
  });

  it("negotiates rather than accepting every supplier offer", () => {
    const supplier = createSupplierAgents()[0];
    const decision = negotiateSupplier(supplier, 40, 55, 4);
    expect(["accept_offer", "counter_offer"]).toContain(decision.action);
    expect(decision.effects.unitCost).toBeGreaterThan(0);
  });

  it("lets competitors react when the business becomes a threat", () => {
    const competitor = createCompetitorAgents()[0];
    const decision = decideCompetitorMove(competitor, business);
    expect(decision.action).toBe("discount_campaign");
    expect(decision.effects.competitorPressure).toBeGreaterThan(0);
  });

  it("evaluates investment using business traction instead of a random outcome", () => {
    const investor = createInvestorAgents()[0];
    const decision = evaluateInvestment(investor, business);
    expect(decision.action).toBe("offer_investment");
    expect(decision.effects.cash).toBeGreaterThan(0);
  });
});
