import { describe, expect, it } from "vitest";
import { advanceDay, calculateKpis, createBusiness } from "./index";

const ITERATIONS = 100;

describe("performance baseline", () => {
  it("measures business creation without changing simulation behavior", () => {
    const started = performance.now();
    let state = createBusiness({
      name: "Baseline Co",
      idea: "A performance benchmark business",
      industry: "Technology",
      structure: "team",
      founderNames: ["Founder"],
    });

    for (let i = 0; i < ITERATIONS; i += 1) {
      state = createBusiness({
        name: `Baseline Co ${i}`,
        idea: "A performance benchmark business",
        industry: "Technology",
        structure: "team",
        founderNames: ["Founder"],
      });
    }

    const elapsedMs = performance.now() - started;
    expect(state.business.status).toBe("active");
    console.info(`[perf-baseline] createBusiness: ${elapsedMs.toFixed(2)}ms total / ${(elapsedMs / ITERATIONS).toFixed(3)}ms avg over ${ITERATIONS} iterations`);
  });

  it("measures one full simulation day and KPI derivation", () => {
    let state = createBusiness({
      name: "Baseline Co",
      idea: "A performance benchmark business",
      industry: "Technology",
      structure: "team",
      founderNames: ["Founder"],
    });

    // Warm up module code paths before timing the hot path.
    state = advanceDay(state);
    calculateKpis(state.business, state.operations);

    const started = performance.now();
    for (let i = 0; i < ITERATIONS; i += 1) {
      state = advanceDay(state);
      calculateKpis(state.business, state.operations);
    }
    const elapsedMs = performance.now() - started;

    expect(state.business.day).toBe(ITERATIONS + 1);
    expect(Number.isFinite(state.business.cash)).toBe(true);
    console.info(`[perf-baseline] advanceDay + calculateKpis: ${elapsedMs.toFixed(2)}ms total / ${(elapsedMs / ITERATIONS).toFixed(3)}ms avg over ${ITERATIONS} iterations`);
  });
});
