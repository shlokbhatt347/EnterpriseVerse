import { describe, expect, it } from "vitest";
import { advanceDay, createBusiness } from "./index";
import { calculateIntegratedMetrics, validateIntegratedState } from "./integration";

describe("integrated business engine", () => {
  it("derives finite cross-system metrics from a fresh business", () => {
    const state = createBusiness({ name: "Integration Co", idea: "Useful products", industry: "Retail", structure: "sole_trader", founderNames: ["Founder"] });
    const metrics = calculateIntegratedMetrics(state);

    expect(Object.values(metrics).every(Number.isFinite)).toBe(true);
    expect(metrics.unitMargin).toBeGreaterThanOrEqual(0);
    expect(metrics.unitMargin).toBeLessThanOrEqual(100);
    expect(metrics.businessHealth).toBeGreaterThanOrEqual(0);
    expect(metrics.businessHealth).toBeLessThanOrEqual(100);
  });

  it("reports a clean state at creation", () => {
    const state = createBusiness({ name: "Clean Co", idea: "A service", industry: "Services", structure: "partnership", founderNames: ["A", "B"] });
    expect(validateIntegratedState(state)).toEqual([]);
  });

  it("detects corrupted financial and bounded state values", () => {
    const state = createBusiness({ name: "Guardrail Co", idea: "A product", industry: "Technology", structure: "sole_trader", founderNames: ["Founder"] });
    const corrupted = { ...state, business: { ...state.business, cash: -1, reputation: 150, marketShare: -2 } };
    const issues = validateIntegratedState(corrupted);

    expect(issues).toContain("business.cash cannot be negative");
    expect(issues).toContain("business.reputation must stay between 0 and 100");
    expect(issues).toContain("business.marketShare must stay between 0 and 100");
  });

  it("keeps cross-system metrics bounded after a simulation day", () => {
    const state = createBusiness({ name: "Dynamic Co", idea: "A product", industry: "Retail", structure: "team", founderNames: ["A", "B", "C"] });
    const next = advanceDay(state);
    const metrics = calculateIntegratedMetrics(next);

    expect(validateIntegratedState(next)).toEqual([]);
    expect(metrics.businessHealth).toBeGreaterThanOrEqual(0);
    expect(metrics.businessHealth).toBeLessThanOrEqual(100);
  });
});
