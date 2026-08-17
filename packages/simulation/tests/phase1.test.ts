import { describe, expect, it } from "vitest";
import type { SimulationState } from "@enterpriseverse/types";
import { assertSimulationState, buildDynamicEvent, createSeededRandom, resolvePhase1Consequences, schedulePhase1Consequences, stableSeed, validateSimulationState } from "../src/phase1";

const business = {
  id: "business-test",
  name: "TestCo",
  idea: "Reliable school supplies",
  industry: "retail",
  structure: "sole_trader" as const,
  founders: [{ id: "founder-1", name: "Test Founder", cash: 20000, reputation: 50, role: "ceo" as const }],
  cash: 2500,
  revenue: 1000,
  expenses: 400,
  reputation: 50,
  day: 3,
  status: "active" as const,
  inventory: 20,
  customers: [],
  suppliers: [{ id: "supplier-1", name: "Supplier", reliability: 80, unitCost: 50, relationship: 55, availableUnits: 100 }],
  marketShare: 2,
};

const state = (): SimulationState => ({ business, events: [], log: [], consequences: { pending: [], resolved: [] } });

describe("Release 1 deterministic simulation foundation", () => {
  it("produces repeatable random sequences", () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    expect(Array.from({ length: 8 }, () => a())).toEqual(Array.from({ length: 8 }, () => b()));
    expect(stableSeed("world", 3)).toBe(stableSeed("world", 3));
  });

  it("selects a state-reactive cash event instead of a day-cycle event", () => {
    const event = buildDynamicEvent({ day: 3, business });
    expect(event.id).toContain("cash-pressure");
    expect(event.choices.map((choice) => choice.id)).toContain("protect-cash");
  });

  it("schedules and resolves delayed consequences", () => {
    const selected = { id: "capture-demand", label: "Capture", effects: { cash: -900 } };
    const scheduled = schedulePhase1Consequences(state(), selected, 3, "test");
    expect(scheduled.consequences?.pending).toHaveLength(1);
    const resolved = resolvePhase1Consequences(scheduled, 5);
    expect(resolved.state.consequences?.pending).toHaveLength(0);
    expect(resolved.state.consequences?.resolved).toHaveLength(1);
    expect(resolved.explanations[0]).toContain("Availability");
  });

  it("rejects invalid simulation state", () => {
    const invalid = { ...state(), business: { ...business, reputation: 101 } };
    expect(validateSimulationState(invalid).some((failure) => failure.code === "reputation-range")).toBe(true);
    expect(() => assertSimulationState(invalid)).toThrow("Simulation invariant violation");
  });
});
