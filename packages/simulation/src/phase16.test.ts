import { describe, expect, it } from "vitest";
import { applyPhase16Decision, assessPhase16Run, createPhase16Run, createPhase16World, getPhase16Archetypes, phase16RunFromSaveData, phase16RunToSaveData, simulatePhase16Alternative } from "./phase16";

describe("Phase 16 replayable business engine", () => {
  const input = {
    name: "Nova Labs",
    idea: "Affordable smart learning tools",
    industry: "Education technology",
    structure: "team" as const,
    founderNames: ["Founder"],
  };

  it("creates deterministic worlds from the same seed", () => {
    const a = createPhase16World(424242, "advanced", "tech_startup");
    const b = createPhase16World(424242, "advanced", "tech_startup");
    expect(a).toEqual(b);
  });

  it("changes the world when the seed changes", () => {
    const a = createPhase16World(1, "standard", "retail");
    const b = createPhase16World(2, "standard", "retail");
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it("exposes all planned business archetypes", () => {
    expect(getPhase16Archetypes()).toHaveLength(8);
    expect(getPhase16Archetypes().map((item) => item.id)).toContain("sustainable");
  });

  it("creates replayable runs with serializable state", () => {
    const run = createPhase16Run({ ...input, seed: 99, difficulty: "expert", archetype: "saas" });
    const restored = phase16RunFromSaveData(phase16RunToSaveData(run));
    expect(restored.seed).toBe(99);
    expect(restored.world.archetype.id).toBe("saas");
    expect(restored.state.business.day).toBe(1);
  });

  it("keeps decision outcomes bounded and records the run", () => {
    const run = createPhase16Run({ ...input, seed: 7, archetype: "retail" });
    const event = run.state.events[0];
    const decision = event.choices[0];
    const next = applyPhase16Decision(run, decision);
    expect(next.decisions).toHaveLength(1);
    expect(next.state.business.cash).toBeGreaterThanOrEqual(0);
    expect(next.state.business.reputation).toBeGreaterThanOrEqual(0);
    expect(next.state.business.reputation).toBeLessThanOrEqual(100);
  });

  it("supports counterfactual evaluation without mutating the live run", () => {
    const run = createPhase16Run({ ...input, seed: 55, archetype: "ecommerce" });
    const alternatives = run.state.events[0].choices;
    const result = simulatePhase16Alternative(run, alternatives[1]);
    expect(Number.isFinite(result.score)).toBe(true);
    expect(run.state.business.day).toBe(1);
    expect(run.decisions).toHaveLength(0);
  });

  it("produces a multi-dimensional founder assessment", () => {
    const run = createPhase16Run({ ...input, seed: 123, archetype: "sustainable", difficulty: "founder" });
    const assessed = assessPhase16Run(run);
    expect(assessed.score).toBeGreaterThanOrEqual(0);
    expect(assessed.score).toBeLessThanOrEqual(100);
    expect(assessed.strengths.length).toBe(3);
    expect(assessed.lessons.length).toBe(3);
  });
});
