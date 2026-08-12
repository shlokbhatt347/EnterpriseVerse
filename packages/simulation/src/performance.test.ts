import { describe, expect, it } from "vitest";
import { assessLearning } from "./learning";
import { calculateIntegratedMetrics } from "./integration";
import { calculateKpis } from "./operations";
import { createBusiness } from "./index";

describe("performance memoization", () => {
  it("reuses derived results for the same immutable state object", () => {
    const state = createBusiness({
      name: "Performance Co",
      idea: "Fast useful products",
      industry: "Technology",
      structure: "team",
      founderNames: ["Founder A", "Founder B"],
    });

    expect(calculateKpis(state)).toBe(calculateKpis(state));
    expect(calculateIntegratedMetrics(state)).toBe(calculateIntegratedMetrics(state));
    expect(assessLearning(state)).toBe(assessLearning(state));
  });

  it("does not share memoized derived values across different states", () => {
    const first = createBusiness({ name: "First Co", idea: "A", industry: "Retail", structure: "sole_trader", founderNames: ["A"] });
    const second = { ...first, business: { ...first.business, cash: first.business.cash + 1 } };

    expect(calculateKpis(first)).not.toBe(calculateKpis(second));
    expect(calculateIntegratedMetrics(first)).not.toBe(calculateIntegratedMetrics(second));
    expect(assessLearning(first)).not.toBe(assessLearning(second));
  });
});
