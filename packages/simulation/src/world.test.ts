import { describe, expect, it } from "vitest";
import { advanceWorld, createWorldState } from "./world";

describe("persistent world engine", () => {
  it("starts on day one", () => {
    expect(createWorldState().date).toEqual({ day: 1, week: 1, month: 1 });
  });

  it("advances the world and keeps market values bounded", () => {
    const result = advanceWorld(createWorldState(), 42);

    expect(result.state.date.day).toBe(2);
    expect(result.state.market.demandMultiplier).toBeGreaterThanOrEqual(0.85);
    expect(result.state.market.demandMultiplier).toBeLessThanOrEqual(1.2);
    expect(result.state.market.supplierCostMultiplier).toBeGreaterThanOrEqual(0.85);
    expect(result.state.market.supplierCostMultiplier).toBeLessThanOrEqual(1.25);
  });

  it("creates a weekly event on day seven", () => {
    let state = createWorldState();
    for (let i = 0; i < 5; i += 1) state = advanceWorld(state, 1).state;

    const result = advanceWorld(state, 1);
    expect(result.state.date.day).toBe(7);
    expect(result.generatedEvents).toHaveLength(1);
  });
});
