import { describe, expect, it } from "vitest";
import { createSimulation } from "./engine";

const input = {
  name: "Northstar",
  idea: "Useful product",
  industry: "technology",
  structure: "sole_trader" as const,
  founderNames: ["Founder"],
  seed: 424242,
};

describe("phase 1 simulation engine", () => {
  it("creates a versioned, seeded state", () => {
    const engine = createSimulation(input);
    expect(engine.state.meta).toEqual({ version: 1, seed: 424242, createdAtDay: 1 });
    expect(engine.state.replay?.seed).toBe(424242);
    expect(engine.validate()).toEqual([]);
  });

  it("keeps the previous engine unchanged when producing a next state", () => {
    const before = createSimulation(input);
    const next = before.advanceDay();
    expect(before.state.business.day).toBe(1);
    expect(next.state.business.day).toBe(2);
    expect(before.state.meta?.seed).toBe(424242);
    expect(next.state.meta?.seed).toBe(424242);
    expect(next.validate()).toEqual([]);
  });

  it("reproduces the same initial state for the same seed and input", () => {
    const a = createSimulation(input).snapshot();
    const b = createSimulation(input).snapshot();
    expect(a).toEqual(b);
  });

  it("uses different seeds without changing the public simulation contract", () => {
    const a = createSimulation({ ...input, seed: 1 });
    const b = createSimulation({ ...input, seed: 2 });
    expect(a.state.meta?.seed).toBe(1);
    expect(b.state.meta?.seed).toBe(2);
    expect(a.validate()).toEqual([]);
    expect(b.validate()).toEqual([]);
  });
});
