import { describe, expect, it } from "vitest";
import { createBusiness } from "./index";
import { createCompetitorAgents, createCustomerAgents, createInvestorAgents, createSupplierAgents } from "./agents";
import { runDailyMarketTurn } from "./dailyTurn";

describe("runDailyMarketTurn", () => {
  it("connects customers, suppliers, competitors and investors in one turn", () => {
    const state = createBusiness({
      name: "Test Enterprise",
      idea: "A practical product",
      industry: "Retail",
      structure: "sole_trader",
      founderNames: ["Founder"],
    });
    const withAgents = {
      ...state,
      agents: {
        customers: createCustomerAgents(),
        suppliers: createSupplierAgents(),
        competitors: createCompetitorAgents(),
        investors: createInvestorAgents(),
      },
    };
    const result = runDailyMarketTurn(withAgents);
    expect(result.decisions.length).toBeGreaterThan(0);
    expect(result.state.business.revenue).toBeGreaterThanOrEqual(state.business.revenue);
    expect(result.state.log.at(-1)).toContain("market-agent decisions processed");
  });
});
