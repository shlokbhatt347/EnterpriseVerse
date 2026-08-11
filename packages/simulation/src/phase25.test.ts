import { describe, expect, it } from "vitest";
import { applyChoice, createBusiness } from "./index";
import { FOUNDER_SETUP_OPTIONS, buildDecisionDebrief, getCoachInsight, getFounderProgress, getFounderSkills, getFirstSessionMilestones } from "./phase25";

describe("Phase 25 founder experience", () => {
  const state = () => createBusiness({ name: "Nova Foods", idea: "Affordable healthy meals", industry: "Food & Beverage", structure: "sole_trader", founderNames: ["Shlok"] });

  it("keeps all four founder structures available", () => {
    expect(FOUNDER_SETUP_OPTIONS.map((option) => option.id)).toEqual(["sole_trader", "partnership", "trio", "team"]);
  });

  it("creates a complete first-session milestone path", () => {
    const milestones = getFirstSessionMilestones(state());
    expect(milestones).toHaveLength(6);
    expect(milestones[0].completed).toBe(true);
    expect(milestones.some((milestone) => milestone.id === "first-sales")).toBe(true);
  });

  it("derives founder skills from canonical simulation state", () => {
    const skills = getFounderSkills(state());
    expect(Object.keys(skills)).toHaveLength(6);
    expect(Object.values(skills).every((value) => value >= 0 && value <= 100)).toBe(true);
  });

  it("produces explainable decision debriefs from declared effects", () => {
    const simulation = state();
    const event = simulation.events[0];
    const choice = event.choices[0];
    const debrief = buildDecisionDebrief(simulation, choice);
    expect(debrief.decisionId).toBe(choice.id);
    expect(debrief.title).toBe(choice.label);
    expect(debrief.lesson.length).toBeGreaterThan(20);
    expect(debrief.signals.length).toBeGreaterThan(0);
  });

  it("changes progression after a real decision", () => {
    const before = state();
    const after = applyChoice(before, before.events[0].choices[0]);
    expect(getFounderProgress(after).xp).toBeGreaterThanOrEqual(getFounderProgress(before).xp);
    expect(getCoachInsight(after).headline.length).toBeGreaterThan(5);
  });
});
