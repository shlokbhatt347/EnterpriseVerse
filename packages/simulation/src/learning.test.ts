import { describe, expect, it } from "vitest";
import { createBusiness, advanceDay } from "./index";
import { assessLearning, scoreDecisionOutcome } from "./learning";

describe("Phase 6 learning engine", () => {
  it("produces bounded diagnostic scores from a fresh business", () => {
    const state = createBusiness({ name: "Learning Co", idea: "A useful product", industry: "Retail", structure: "sole_trader", founderNames: ["Founder"] });
    const assessment = assessLearning(state);

    expect(Number.isFinite(assessment.overallScore)).toBe(true);
    expect(assessment.overallScore).toBeGreaterThanOrEqual(0);
    expect(assessment.overallScore).toBeLessThanOrEqual(100);
    expect(assessment.strengths).toHaveLength(2);
    expect(assessment.priorities).toHaveLength(2);
    expect(assessment.reflectionQuestions).toHaveLength(3);
  });

  it("keeps learning dimensions actionable and ordered", () => {
    const state = createBusiness({ name: "Strategy Co", idea: "A service", industry: "Services", structure: "team", founderNames: ["A", "B", "C"] });
    const assessment = assessLearning(state);

    expect(assessment.strengths[0].score).toBeGreaterThanOrEqual(assessment.strengths[1].score);
    expect(assessment.priorities[0].score).toBeLessThanOrEqual(assessment.priorities[1].score);
    expect(assessment.summary.length).toBeGreaterThan(20);
    expect(assessment.priorities[0].nextStep.length).toBeGreaterThan(10);
  });

  it("scores an outcome without producing non-finite values", () => {
    const before = createBusiness({ name: "Decision Co", idea: "A product", industry: "Technology", structure: "partnership", founderNames: ["A", "B"] });
    const after = advanceDay(before);
    const score = scoreDecisionOutcome(before, after);

    expect(Number.isFinite(score)).toBe(true);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
