import { describe, expect, it } from "vitest";
import { advanceDay, applyChoice, createBusiness } from "../src/index";

describe("EnterpriseVerse simulation", () => {
  it("creates businesses with structure-specific starting cash", () => {
    const state = createBusiness({ name: "Nova", structure: "partnership", founderNames: ["A", "B"] });
    expect(state.business.cash).toBe(35_000);
    expect(state.business.founders).toHaveLength(2);
    expect(state.events).toHaveLength(1);
  });

  it("advances the business clock and records operating activity", () => {
    const state = createBusiness({ name: "Nova", structure: "sole_trader", founderNames: ["A"] });
    const next = advanceDay(state);
    expect(next.business.day).toBe(2);
    expect(next.business.revenue).toBeGreaterThanOrEqual(700);
    expect(next.log.length).toBe(2);
  });

  it("applies decisions without allowing reputation outside 0-100", () => {
    const state = createBusiness({ name: "Nova", structure: "team", founderNames: ["A"] });
    const next = applyChoice(state, { id: "bad", label: "Bad choice", effects: { reputation: -1000 } });
    expect(next.business.reputation).toBe(0);
  });
});
