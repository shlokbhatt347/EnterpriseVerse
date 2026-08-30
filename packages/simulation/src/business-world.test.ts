import { describe, expect, it } from "vitest";
import { createRng, createWorld, runLong, runMonteCarlo, stepWorld, validateWorld } from "./business-world";

describe("Phase 3 business world", () => {
  it("is deterministic for the same seed and decisions", () => {
    const a = createWorld(42, "retail");
    const b = createWorld(42, "retail");
    const ra = createRng(42); const rb = createRng(42);
    const decisions = { price: 96, marketing: 40, training: 12, hiring: 2, rdInvestment: 20 };
    for (let i = 0; i < 30; i++) {
      const x = stepWorld(a, decisions, ra).state;
      const y = stepWorld(b, decisions, rb).state;
      expect(x).toEqual(y);
      Object.assign(a, x); Object.assign(b, y);
    }
  });

  it("connects pricing to demand and outcomes", () => {
    const low = createWorld(7, "retail");
    const high = createWorld(7, "retail");
    const r1 = stepWorld(low, { price: 70 }, createRng(7));
    const r2 = stepWorld(high, { price: 180 }, createRng(7));
    expect(r1.state.business.product.price).toBe(70);
    expect(r2.state.business.product.price).toBe(180);
    expect(r1.effects.some(e => e.target === "demand")).toBe(true);
    expect(r1.state.business.revenue).not.toBe(r2.state.business.revenue);
  });

  it("keeps world values valid over long horizons", () => {
    const world = runLong(createWorld(123, "manufacturing"), 1000, createRng(123));
    expect(validateWorld(world)).toEqual([]);
    expect(Number.isFinite(world.business.valuation)).toBe(true);
    expect(world.day).toBeGreaterThanOrEqual(1001);
  });

  it("supports repeatable Monte Carlo calibration", () => {
    const a = runMonteCarlo(30, 100, 99, "technology");
    const b = runMonteCarlo(30, 100, 99, "technology");
    expect(a).toEqual(b);
    expect(a.survivalRate).toBeGreaterThanOrEqual(0);
    expect(a.survivalRate).toBeLessThanOrEqual(1);
    expect(Number.isFinite(a.meanValuation)).toBe(true);
  });

  it("produces different strategic outcomes without changing the world seed", () => {
    const conservative = createWorld(55, "services");
    const aggressive = createWorld(55, "services");
    const r1 = createRng(55); const r2 = createRng(55);
    let a = conservative; let b = aggressive;
    for (let i = 0; i < 60; i++) {
      a = stepWorld(a, { price: 105, marketing: 5, training: 4 }, r1).state;
      b = stepWorld(b, { price: 82, marketing: 100, hiring: 8, capacityInvestment: 80, borrowing: 500 }, r2).state;
    }
    expect(a.business.revenue).not.toBe(b.business.revenue);
    expect(a.business.stage).toBeDefined();
    expect(b.business.stage).toBeDefined();
  });
});
