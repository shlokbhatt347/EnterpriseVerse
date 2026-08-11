import { describe, expect, it } from "vitest";
import { buildLivingWorldEvent, getLivingWorldSummary, negotiateWithSupplier } from "./phase26";
import { createBusiness } from "./index";

describe("Phase 26 living world", () => {
  const state = createBusiness({ name: "Atlas", idea: "Useful products", industry: "Retail", structure: "sole_trader", founderNames: ["Founder"] });

  it("classifies a stable starting economy", () => {
    const summary = getLivingWorldSummary(state);
    expect(summary.economy).toBe("stable");
    expect(summary.competitorLeaders.length).toBeGreaterThan(0);
  });

  it("creates a competitor response when pressure is high", () => {
    const pressured = { ...state, market: { ...state.market!, competitivePressure: 80 } };
    const event = buildLivingWorldEvent(pressured);
    expect(event?.title).toContain("attacking your market");
    expect(event?.choices).toHaveLength(3);
  });

  it("creates a deterministic supplier negotiation", () => {
    const first = negotiateWithSupplier(state);
    const second = negotiateWithSupplier(state);
    expect(first.choice).toEqual(second.choice);
    expect(first.title).toBeTruthy();
  });
});
