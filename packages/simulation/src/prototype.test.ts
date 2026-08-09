import { describe, expect, it } from "vitest";
import { buildPrototypeSummary, getPrototypeStage } from "./prototype";
import type { SimulationState } from "@enterpriseverse/types";

const makeState = (day: number, cash = 10000): SimulationState => ({
  business: {
    id: "prototype-test",
    name: "Prototype Test",
    idea: "Test business",
    industry: "Technology",
    structure: "sole_trader",
    founders: [{ id: "f1", name: "Founder", cash: 0, reputation: 50 }],
    cash,
    revenue: 1000,
    expenses: 500,
    reputation: 50,
    day,
    status: "active",
    inventory: 10,
    customers: [],
    suppliers: [],
    marketShare: 1,
  },
  events: [],
  log: ["Started business"],
} as SimulationState);

describe("prototype completion helpers", () => {
  it("maps business days to lifecycle presentation stages", () => {
    expect(getPrototypeStage(makeState(1))).toBe("launch");
    expect(getPrototypeStage(makeState(10))).toBe("survival");
    expect(getPrototypeStage(makeState(45))).toBe("growth");
    expect(getPrototypeStage(makeState(120))).toBe("expansion");
    expect(getPrototypeStage(makeState(200))).toBe("maturity");
  });

  it("detects financial distress", () => {
    const state = makeState(10, 0);
    expect(getPrototypeStage(state)).toBe("distress");
    expect(buildPrototypeSummary(state).isDistressed).toBe(true);
    expect(buildPrototypeSummary(state).isViable).toBe(false);
  });

  it("bounds prototype progress and preserves recent milestones", () => {
    const state = makeState(45);
    const summary = buildPrototypeSummary(state);
    expect(summary.progress).toBe(25);
    expect(summary.milestones).toHaveLength(1);
    expect(summary.isViable).toBe(true);
  });
});
