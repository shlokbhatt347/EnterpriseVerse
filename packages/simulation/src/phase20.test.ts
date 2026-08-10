import { describe, expect, it } from "vitest";
import type { SimulationState } from "@enterpriseverse/types";
import { advanceLivingWorld20, compareReplayRuns20, createLivingWorld20, generateWorldEvent20, recordWorldMemory20, registerCauseEffect20, summarizeLivingWorld20 } from "./phase20";

const simulation = { business: { id: "b", name: "Test", idea: "Test", industry: "Technology", structure: "sole_trader", founders: [], cash: 20_000, revenue: 2_000, expenses: 700, reputation: 60, day: 2, status: "active", inventory: 12, customers: [], suppliers: [], marketShare: 2 }, operations: { price: 120, quality: 70, marketingBudget: 0, productionCapacity: 20, employees: 1, supplierUnitCost: 60, brandAwareness: 50, customerSatisfaction: 70, debt: 0 }, market: { demandIndex: 100, marketPrice: 100, competitorPrice: 110, competitorQuality: 65, competitorMarketShare: 20, trend: "stable", confidence: 70, priceElasticity: 1, customerAcquisition: 10, competitivePressure: 50, strategyScore: 60 }, events: [], log: [] } as SimulationState;

describe("Phase 20 — living world + replayability", () => {
  it("creates deterministic worlds from the same seed", () => {
    expect(createLivingWorld20(42, 8)).toEqual(createLivingWorld20(42, 8));
    expect(createLivingWorld20(42, 8).competitors).toHaveLength(8);
  });

  it("generates the same event for the same world and day", () => {
    const world = createLivingWorld20(42);
    const a = generateWorldEvent20(world.seed, 7, world.market);
    const b = generateWorldEvent20(world.seed, 7, world.market);
    expect(a).toEqual(b);
  });

  it("keeps memory and cause-effect histories bounded and deterministic", () => {
    let world = createLivingWorld20(7);
    world = recordWorldMemory20(world, { entityId: "player", day: 1, topic: "decision", summary: "Invested", sentiment: 12, strength: 50 });
    world = registerCauseEffect20(world, { source: "invest", sourceType: "player", day: 1, observedDay: 2, delayDays: 1, effects: { cash: -500 }, explanation: "Investment reduces cash immediately.", confidence: 90 });
    expect(world.memories).toHaveLength(1);
    expect(world.causes).toHaveLength(1);
    expect(world.memories[0].id).toBe(recordWorldMemory20(createLivingWorld20(7), { entityId: "player", day: 1, topic: "decision", summary: "Invested", sentiment: 12, strength: 50 }).memories[0].id);
  });

  it("advances the living world without mutating the source world", () => {
    const world = createLivingWorld20(11);
    const next = advanceLivingWorld20({ state: world, simulation, day: 2, decision: { id: "quality", label: "Invest in quality", effects: { cash: -800, reputation: 2 } } });
    expect(world.snapshots).toHaveLength(0);
    expect(next.snapshots).toHaveLength(1);
    expect(next.decisions).toEqual(["2:quality"]);
    expect(next.memories.length).toBeGreaterThan(0);
    expect(next.causes.length).toBeGreaterThan(0);
    expect(next.snapshots[0].signature).toBe(advanceLivingWorld20({ state: world, simulation, day: 2, decision: { id: "quality", label: "Invest in quality", effects: { cash: -800, reputation: 2 } } }).snapshots[0].signature);
  });

  it("summarizes and compares replay runs", () => {
    const a = advanceLivingWorld20({ state: createLivingWorld20(1), simulation, day: 2 });
    const b = advanceLivingWorld20({ state: createLivingWorld20(2), simulation, day: 2 });
    const summary = summarizeLivingWorld20(a);
    expect(summary.days).toBe(1);
    expect(summary.signature).toBe(a.snapshots[0].signature);
    expect(compareReplayRuns20(a, b)).not.toBeNull();
  });
});
