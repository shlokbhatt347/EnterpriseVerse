import { describe, expect, it } from "vitest";
import { createPhase23Debrief, createSkillProfile23, evaluatePhase23Decision, generatePhase23Challenge, getPhase23Scenarios, phase23Signature, recordPhase23Learning, type LearningRecord23 } from "./phase23";

describe("Phase 23 — advanced simulation, adaptive learning and education", () => {
  it("exposes a meaningful scenario library with complete choices", () => {
    const scenarios = getPhase23Scenarios();
    expect(scenarios.length).toBeGreaterThanOrEqual(6);
    expect(scenarios.every((s) => s.choices.length === 3)).toBe(true);
    expect(new Set(scenarios.map((s) => s.category)).size).toBeGreaterThanOrEqual(5);
  });

  it("starts with a balanced founder profile", () => {
    const profile = createSkillProfile23();
    expect(Object.values(profile.skills).every((value) => value === 50)).toBe(true);
    expect(profile.totalDecisions).toBe(0);
  });

  it("learns from decision quality without leaving bounds", () => {
    const scenario = getPhase23Scenarios()[0];
    let history: LearningRecord23[] = [];
    const profile = createSkillProfile23();
    const evaluation = evaluatePhase23Decision(scenario, "stage", profile, { cash: 30000, reputation: 70, marketPressure: 50 });
    history = recordPhase23Learning(history, evaluation, 1, scenario.category, scenario.skills);
    const next = createSkillProfile23(history);
    expect(evaluation.score).toBeGreaterThanOrEqual(0);
    expect(evaluation.score).toBeLessThanOrEqual(100);
    expect(Object.values(next.skills).every((value) => value >= 0 && value <= 100)).toBe(true);
    expect(next.totalDecisions).toBe(1);
  });

  it("adapts the next challenge toward weak skills after poor decisions", () => {
    const scenario = getPhase23Scenarios().find((s) => s.id === "price-war-23")!;
    const weakRecord: LearningRecord23 = { scenarioId: scenario.id, day: 1, category: scenario.category, skills: ["finance", "risk"], score: 30, quality: "dangerous", lesson: scenario.lesson };
    const profile = createSkillProfile23([weakRecord]);
    const challenge = generatePhase23Challenge(123, profile, [weakRecord]);
    expect(challenge.reason).toBe("recent_failure");
    expect(challenge.targetSkills.length).toBeGreaterThan(0);
  });

  it("is deterministic for the same seed and history", () => {
    const profile = createSkillProfile23();
    const a = generatePhase23Challenge(4242, profile, []);
    const b = generatePhase23Challenge(4242, profile, []);
    expect(a).toEqual(b);
    expect(phase23Signature(a, [])).toBe(phase23Signature(b, []));
  });

  it("penalizes reckless decisions when liquidity and pressure are poor", () => {
    const scenario = getPhase23Scenarios()[0];
    const profile = createSkillProfile23();
    const reckless = evaluatePhase23Decision(scenario, "bet-big", profile, { cash: 5000, reputation: 25, marketPressure: 85 });
    const staged = evaluatePhase23Decision(scenario, "stage", profile, { cash: 5000, reputation: 25, marketPressure: 85 });
    expect(staged.score).toBeGreaterThan(reckless.score);
  });

  it("produces an actionable end-of-run debrief", () => {
    const scenario = getPhase23Scenarios()[0];
    const evaluation = evaluatePhase23Decision(scenario, "stage", createSkillProfile23());
    const history = recordPhase23Learning([], evaluation, 1, scenario.category, scenario.skills);
    const debrief = createPhase23Debrief(history);
    expect(debrief.decisionCount).toBe(1);
    expect(debrief.strengths).toHaveLength(3);
    expect(debrief.blindSpots).toHaveLength(3);
    expect(debrief.nextChallenge.length).toBeGreaterThan(10);
  });
});
