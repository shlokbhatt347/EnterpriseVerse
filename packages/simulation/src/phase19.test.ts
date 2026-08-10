import { describe, expect, it } from "vitest";
import type { SimulationState } from "@enterpriseverse/types";
import { createCompetitorAgents19, decideCompetitor19, evolveLivingMarket19, generatePersonalities19, runLivingEconomyStep19 } from "./phase19";

const state = { business: { reputation: 60, marketShare: 12 }, operations: { price: 100, quality: 65 }, market: { marketPrice: 100, competitivePressure: 55, confidence: 70 } } as SimulationState;

describe("Phase 19 — AI competitors and living economy", () => {
  it("generates exactly 100 deterministic personalities", () => {
    const first = generatePersonalities19(12345, 100);
    const second = generatePersonalities19(12345, 100);
    expect(first).toHaveLength(100);
    expect(first).toEqual(second);
    expect(new Set(first.map((p) => JSON.stringify(p.traits))).size).toBeGreaterThan(90);
  });

  it("caps personality and active competitor counts safely", () => {
    expect(generatePersonalities19(1, 500)).toHaveLength(100);
    expect(createCompetitorAgents19(1, 500)).toHaveLength(20);
  });

  it("evolves the market deterministically from seed and day", () => {
    const a = evolveLivingMarket19({ seed: 7, day: 4, competitorStrength: 60, playerReputation: 55, supplyReliability: 75 });
    const b = evolveLivingMarket19({ seed: 7, day: 4, competitorStrength: 60, playerReputation: 55, supplyReliability: 75 });
    expect(a).toEqual(b);
    expect(a.demandIndex).toBeGreaterThanOrEqual(55);
    expect(a.demandIndex).toBeLessThanOrEqual(145);
    expect(a.inflation).toBeGreaterThanOrEqual(0);
    expect(a.inflation).toBeLessThanOrEqual(15);
  });

  it("produces deterministic adaptive competitor decisions", () => {
    const personality = generatePersonalities19(9, 1)[0];
    const market = evolveLivingMarket19({ seed: 9, day: 2 });
    expect(decideCompetitor19(personality, market, state, 0)).toEqual(decideCompetitor19(personality, market, state, 0));
    expect(["cut_price", "raise_quality", "expand", "defend_niche", "hold"]).toContain(decideCompetitor19(personality, market, state).action);
  });

  it("creates a replay-stable living economy step", () => {
    const a = runLivingEconomyStep19({ seed: 42, day: 8, state });
    const b = runLivingEconomyStep19({ seed: 42, day: 8, state });
    expect(a).toEqual(b);
    expect(a.competitors).toHaveLength(8);
    expect(a.replaySignature).toBe(b.replaySignature);
  });
});
