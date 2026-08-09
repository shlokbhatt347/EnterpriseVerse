import { describe, expect, it } from "vitest";
import { advanceDay, applyChoice, createBusiness } from "../src/index";

describe("EnterpriseVerse simulation", () => {
  it("creates businesses with structure-specific starting cash", () => {
    const state = createBusiness({
      name: "Nova",
      idea: "A practical test enterprise",
      industry: "Services",
      structure: "partnership",
      founderNames: ["A", "B"],
    });
    expect(state.business.cash).toBe(35_000);
    expect(state.business.founders).toHaveLength(2);
    expect(state.events).toHaveLength(1);
  });

  it("advances the business clock and records operating activity", () => {
    const state = createBusiness({
      name: "Nova",
      idea: "A practical test enterprise",
      industry: "Services",
      structure: "sole_trader",
      founderNames: ["A"],
    });
    const next = advanceDay(state);
    expect(next.business.day).toBe(2);
    expect(next.business.revenue).toBeGreaterThanOrEqual(700);
    // The persistent market/agent engine adds reaction entries to the log.
    // Keep the test focused on the contract that activity is recorded rather
    // than coupling it to the exact number of AI reactions in a given round.
    expect(next.log.length).toBeGreaterThan(2);
    expect(next.log[0]).toContain("Nova");
    expect(next.agents?.lastDecisions.length).toBeGreaterThan(0);
  });

  it("applies decisions without allowing reputation outside 0-100", () => {
    const state = createBusiness({
      name: "Nova",
      idea: "A practical test enterprise",
      industry: "Services",
      structure: "team",
      founderNames: ["A"],
    });
    const next = applyChoice(state, { id: "bad", label: "Bad choice", effects: { reputation: -1000 } });
    expect(next.business.reputation).toBe(0);
  });
});
