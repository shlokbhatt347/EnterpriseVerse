import { describe, expect, it } from "vitest";
import { advanceDay, applyChoice, createBusiness, getLifecycle, getRunAssessment } from "./index";
import { hireEmployee, trainEmployee } from "./workforce";
import { calculateFinancialSnapshot } from "./finance";
import { createConsequenceState, advanceConsequences, scheduleConsequence } from "./consequences";
import { createScenarioState, advanceScenarios } from "./scenarios";
import { createReplayState, recordDecision, recordSnapshot } from "./replay";

const businessInput = { name: "Phase Eight", idea: "A useful product", industry: "Technology", structure: "sole_trader" as const, founderNames: ["Founder"] };

describe("Phase 8 living business engine", () => {
  it("initializes lifecycle, finance, workforce, scenario and replay state", () => {
    const state = createBusiness(businessInput);
    expect(getLifecycle(state)).toBe("launch");
    expect(state.workforce?.employees).toHaveLength(1);
    expect(state.business.customers).toHaveLength(3);
    expect(state.financials?.cash).toBe(state.business.cash);
    expect(state.scenarios?.seed).toBe(1);
    expect(state.replay?.snapshots).toHaveLength(1);
  });

  it("advances the integrated state without losing new systems", () => {
    const next = advanceDay(createBusiness(businessInput));
    expect(next.business.day).toBe(2);
    expect(next.financials?.day).toBe(2);
    expect(next.workforce).toBeDefined();
    expect(next.replay?.snapshots).toHaveLength(2);
    expect(next.scenarios?.history).toBeDefined();
  });

  it("supports hiring and training with bounded workforce metrics", () => {
    const state = hireEmployee({ employees: [], hiringBudget: 1_000, trainingBudget: 500, turnoverRisk: 0, productivityIndex: 0, moraleIndex: 0, payroll: 0 }, "Ava", "operations", 1, 300);
    const trained = trainEmployee(state, state.employees[0].id, 1, 250);
    expect(trained.employees[0].skill).toBeGreaterThan(state.employees[0].skill);
    expect(trained.payroll).toBe(300);
  });

  it("keeps financial runway and valuation finite", () => {
    const state = createBusiness(businessInput);
    const snapshot = calculateFinancialSnapshot(state.business, state.operations!, 1_200, 0);
    expect(Number.isFinite(snapshot.runwayDays)).toBe(true);
    expect(snapshot.valuation).toBeGreaterThanOrEqual(0);
  });

  it("executes delayed consequences", () => {
    const consequence = { id: "c1", source: "test", day: 1, delayDays: 2, effects: { reputation: 5 }, explanation: "Delayed effect" };
    const scheduled = scheduleConsequence(createConsequenceState(), consequence);
    const early = advanceConsequences(scheduled, 2);
    expect(early.effects.reputation ?? 0).toBe(0);
    const due = advanceConsequences(early.state, 3);
    expect(due.effects.reputation).toBe(5);
  });

  it("keeps scenario randomness deterministic for a fixed seed and day", () => {
    const business = createBusiness(businessInput).business;
    const a = advanceScenarios(createScenarioState(42), business);
    const b = advanceScenarios(createScenarioState(42), business);
    expect(a.state.active).toEqual(b.state.active);
    expect(a.effects).toEqual(b.effects);
  });

  it("records replay decisions and produces a run assessment", () => {
    const state = createBusiness(businessInput);
    const replay = recordDecision(recordSnapshot(createReplayState(7), state.business, state.operations, state.market, state.financials), "test-choice");
    expect(replay.decisions).toContain("test-choice");
    const changed = applyChoice(state, { id: "test", label: "Invest", effects: { cash: -100, reputation: 3 } });
    const assessment = getRunAssessment(changed);
    expect(assessment.score).toBeGreaterThanOrEqual(0);
    expect(assessment.score).toBeLessThanOrEqual(100);
    expect(assessment.profile.primary).toBeTruthy();
  });
});
