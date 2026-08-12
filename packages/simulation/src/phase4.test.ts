import { describe, expect, it } from "vitest";
import { createBusiness } from "./index";
import { getPhase4CommandCenter, calculatePhase4Health, buildPhase4Attention, previewPhase4Decision, advancePhase4Day } from "./phase4";

function starter() {
  return createBusiness({
    name: "Phase Four Labs",
    idea: "Fast consumer software",
    industry: "Technology",
    structure: "sole_trader",
    founderNames: ["Founder"],
  });
}

describe("Phase 4 executive command center", () => {
  it("builds a bounded executive read model from the canonical simulation state", () => {
    const state = starter();
    const model = getPhase4CommandCenter(state);
    expect(model.briefing.health.overall).toBeGreaterThanOrEqual(0);
    expect(model.briefing.health.overall).toBeLessThanOrEqual(100);
    expect(model.briefing.market.demand).toBeGreaterThanOrEqual(0);
    expect(model.competitors.length).toBeLessThanOrEqual(5);
    expect(model.recentEvents.length).toBeLessThanOrEqual(5);
  });

  it("turns actual company pressure into prioritized attention", () => {
    const state = starter();
    const stressed = {
      ...state,
      business: { ...state.business, cash: 1000 },
      market: { ...state.market!, competitivePressure: 80 },
    };
    const health = calculatePhase4Health(stressed);
    const attention = buildPhase4Attention(stressed);
    expect(health.financial).toBeLessThan(55);
    expect(attention.length).toBeGreaterThan(0);
    expect(attention[0].severity).toBe("critical");
  });

  it("previews choices without mutating the source state", () => {
    const state = starter();
    const choice = state.events[0].choices[0];
    const originalCash = state.business.cash;
    const preview = previewPhase4Decision(state, choice);
    expect(preview.choiceId).toBe(choice.id);
    expect(state.business.cash).toBe(originalCash);
  });

  it("advances the existing living-world engine without creating a second state model", () => {
    const state = starter();
    const next = advancePhase4Day(state);
    expect(next.business.day).toBe(state.business.day + 1);
    expect(next.market).toBeDefined();
    expect(next.agents).toBeDefined();
    expect(next.scenarios).toBeDefined();
  });
});
