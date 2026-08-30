import { describe, expect, it } from "vitest";
import { createBusiness } from "./index";
import { projectPhase4History, projectPhase4State } from "./phase4-projection";

describe("Phase 4 canonical state projection", () => {
  it("projects authoritative business state without mutating it", () => {
    const state = createBusiness({ name: "Projection Co", idea: "Useful software", industry: "technology", structure: "sole_trader", founderNames: ["Founder"] });
    const before = JSON.stringify(state);
    const projection = projectPhase4State(state);

    expect(JSON.stringify(state)).toBe(before);
    expect(projection.version).toBe(1);
    expect(projection.day).toBe(state.business.day);
    expect(projection.business.id).toBe(state.business.id);
    expect(projection.business.cash.value).toBe(state.business.cash);
    expect(projection.business.cash.confidence).toBe("known");
    expect(projection.business.revenue.value).toBe(state.business.revenue);
  });

  it("keeps bounded presentation metrics bounded", () => {
    const state = createBusiness({ name: "Bounded Co", idea: "Reliable goods", industry: "retail", structure: "team", founderNames: ["A", "B"] });
    const projection = projectPhase4State(state);
    const bounded = [
      projection.business.reputation.value,
      projection.business.marketShare.value,
      projection.world.demand.value,
      projection.world.confidence.value,
      projection.world.competitivePressure.value,
      projection.customers.averageTrust,
      projection.customers.satisfaction,
      projection.customers.churnSignal,
      projection.operations.quality,
      projection.operations.workforceHealth,
      projection.workforce.morale,
      projection.workforce.productivity,
      projection.workforce.retention,
    ];
    for (const value of bounded) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it("marks derived values with their information quality", () => {
    const state = createBusiness({ name: "Intel Co", idea: "Better service", industry: "services", structure: "partnership", founderNames: ["A", "B"] });
    const projection = projectPhase4State(state);
    expect(projection.world.demand.confidence).toBe("estimated");
    expect(projection.world.confidence.confidence).toBe("estimated");
    expect(projection.customers.confidence).toBe("estimated");
    expect(projection.operations.confidence).toBe("estimated");
  });

  it("projects recent causal events as known facts", () => {
    const state = createBusiness({ name: "Events Co", idea: "Better logistics", industry: "logistics", structure: "trio", founderNames: ["A", "B", "C"] });
    const projection = projectPhase4State(state);
    expect(projection.causes.length).toBeGreaterThan(0);
    expect(projection.causes[0].confidence).toBe("known");
    expect(projection.causes[0].day).toBeGreaterThan(0);
  });

  it("supports immutable history projection", () => {
    const first = createBusiness({ name: "History Co", idea: "Useful product", industry: "food", structure: "sole_trader", founderNames: ["A"] });
    const second = { ...first, business: { ...first.business, day: 2, cash: first.business.cash - 100 } };
    const history = projectPhase4History([first, second]);
    expect(history).toHaveLength(2);
    expect(history[0].day).toBe(1);
    expect(history[1].day).toBe(2);
    expect(history[1].business.cash.value).toBe(first.business.cash - 100);
  });
});
