import { describe, expect, it } from "vitest";
import { BUSINESS_ARCHETYPES, CONTENT_SCENARIOS, DIFFICULTIES, getArchetype, getDifficulty, replayFingerprint, selectScenario } from "./content";

describe("phase 10 content catalog", () => {
  it("contains the planned archetypes, difficulties and scenario coverage", () => {
    expect(BUSINESS_ARCHETYPES).toHaveLength(6);
    expect(DIFFICULTIES).toHaveLength(4);
    expect(CONTENT_SCENARIOS).toHaveLength(30);
    expect(new Set(CONTENT_SCENARIOS.map((scenario) => scenario.category)).size).toBe(6);
  });

  it("returns stable catalog records for valid ids", () => {
    expect(getArchetype("food_business").name).toBe("Food Business");
    expect(getDifficulty("expert").scenarioPressure).toBe(1.45);
  });

  it("selects deterministic scenarios and avoids used content when alternatives exist", () => {
    const first = selectScenario(42, 12, "advanced");
    const second = selectScenario(42, 12, "advanced");
    expect(second.id).toBe(first.id);

    const next = selectScenario(42, 12, "advanced", [first.id]);
    expect(next.id).not.toBe(first.id);
  });

  it("creates stable replay fingerprints", () => {
    const a = replayFingerprint(7, ["hire", "price-up", "expand"], 30);
    const b = replayFingerprint(7, ["hire", "price-up", "expand"], 30);
    const c = replayFingerprint(7, ["hire", "price-down", "expand"], 30);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^ev-[0-9a-f]{8}$/);
  });
});
