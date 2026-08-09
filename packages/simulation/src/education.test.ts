import { describe, expect, it } from "vitest";
import type { SimulationState } from "@enterpriseverse/types";
import { assessmentBank, assessRun, learningObjectives, scoreAnswer, updateMastery } from "./education";

describe("education and assessment", () => {
  it("defines objectives across core business domains", () => {
    expect(learningObjectives.length).toBeGreaterThanOrEqual(7);
    expect(new Set(learningObjectives.map((item) => item.domain)).size).toBe(7);
  });

  it("scores correct and incorrect answers deterministically", () => {
    const question = assessmentBank[0];
    expect(scoreAnswer(question, question.answer).correct).toBe(true);
    expect(scoreAnswer(question, "wrong answer").correct).toBe(false);
  });

  it("updates mastery within bounds", () => {
    const result = scoreAnswer(assessmentBank[0], assessmentBank[0].answer);
    const high = updateMastery({ scores: { finance: 98 }, attempts: 0, correct: 0 }, result);
    expect(high.scores.finance).toBe(100);
    const low = updateMastery({ scores: { finance: 0 }, attempts: 0, correct: 0 }, { ...result, correct: false, score: 0 });
    expect(low.scores.finance).toBe(0);
  });

  it("produces a safe run assessment when outcomes are absent", () => {
    const state = { outcomes: [] } as unknown as SimulationState;
    const assessment = assessRun(state);
    expect(assessment.score).toBeGreaterThanOrEqual(0);
    expect(assessment.score).toBeLessThanOrEqual(100);
    expect(assessment.profile.primary).toBeTruthy();
  });
});
