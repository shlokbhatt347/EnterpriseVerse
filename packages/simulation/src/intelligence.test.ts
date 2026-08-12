import { describe, expect, it } from "vitest";
import { buildEnterpriseBrief, runWhatIf, type AdvisorRole } from "./intelligence";
import { createBusiness } from "./index";
import type { SimulationState } from "@enterpriseverse/types";

function state(): SimulationState {
  return createBusiness({
    name: "Nova Labs",
    idea: "Build useful products",
    industry: "Technology",
    structure: "sole_trader",
    founderNames: ["Founder"],
  });
}

describe("Phase 6 intelligence", () => {
  it("produces a deterministic brief for every executive role", () => {
    const roles: AdvisorRole[] = ["ceo", "cfo", "cmo", "coo", "cto", "chro"];
    const current = state();
    for (const role of roles) {
      const first = buildEnterpriseBrief(current, role);
      const second = buildEnterpriseBrief(current, role);
      expect(first).toEqual(second);
      expect(first.priorities.length).toBeGreaterThan(0);
      expect(first.healthScore).toBeGreaterThanOrEqual(0);
      expect(first.healthScore).toBeLessThanOrEqual(100);
    }
  });

  it("does not mutate the real simulation when running a what-if", () => {
    const current = state();
    const before = JSON.stringify(current);
    const result = runWhatIf(current, { priceDeltaPct: 5, marketingBudget: 2000, hiring: 2 });
    expect(JSON.stringify(current)).toBe(before);
    expect(result.projected.revenue).toBeGreaterThanOrEqual(0);
    expect(result.projected.cash).toBeTypeOf("number");
  });

  it("exposes explicit warnings for unsafe what-if scenarios", () => {
    const current = state();
    const result = runWhatIf(current, { debtPayment: current.business.cash + 1 });
    expect(result.warnings.some((warning) => warning.toLowerCase().includes("cash"))).toBe(true);
    expect(result.confidence).toBe("directional");
  });

  it("grounds CFO evidence in live simulation values", () => {
    const current = state();
    current.business.cash = 4_000;
    current.operations = { ...(current.operations ?? {} as never), debt: 10_000 } as SimulationState["operations"];
    const brief = buildEnterpriseBrief(current, "cfo");
    const combined = brief.priorities.map((item) => item.evidence).join(" ");
    expect(combined).toContain("₹4,000");
  });

  it("returns a consistent metric set for the intelligence dashboard", () => {
    const brief = buildEnterpriseBrief(state(), "ceo");
    expect(brief.metrics.map((item) => item.label)).toEqual(["Cash", "Revenue", "Market share", "Reputation"]);
  });
});
