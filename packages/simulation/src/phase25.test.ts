import { describe, expect, it } from "vitest";
import { buildDecisionDebrief, buildFounderDashboard, FOUNDER_SETUP_OPTIONS, getFirstSessionMilestones } from "./phase25";
import { createBusiness } from "./index";

describe("Phase 25 guided simulation experience", () => {
  it("defines all four founder structures with distinct starting capital", () => {
    expect(FOUNDER_SETUP_OPTIONS).toHaveLength(4);
    expect(new Set(FOUNDER_SETUP_OPTIONS.map((option) => option.startingCapital)).size).toBe(4);
  });

  it("creates a useful first-session path at launch", () => {
    const state = createBusiness({ name: "Nova Foods", idea: "Affordable healthy meals", industry: "Food & Beverage", structure: "sole_trader", founderNames: ["Shlok"] });
    const milestones = getFirstSessionMilestones(state);
    expect(milestones[0].completed).toBe(true);
    expect(milestones.find((milestone) => milestone.id === "first-sales")?.completed).toBe(false);
  });

  it("builds a dashboard without mutating simulation state", () => {
    const state = createBusiness({ name: "Nova", idea: "A useful product", industry: "Technology", structure: "partnership", founderNames: ["Shlok", "Mira"] });
    const beforeDay = state.business.day;
    const dashboard = buildFounderDashboard(state);
    expect(dashboard.cash).toBe(state.business.cash);
    expect(dashboard.businessHealth).toBeGreaterThanOrEqual(0);
    expect(dashboard.businessHealth).toBeLessThanOrEqual(100);
    expect(state.business.day).toBe(beforeDay);
  });

  it("turns a decision into an explainable debrief", () => {
    const state = createBusiness({ name: "Nova", idea: "A useful product", industry: "Technology", structure: "sole_trader", founderNames: ["Shlok"] });
    const debrief = buildDecisionDebrief(state, { id: "test", label: "Invest for growth", effects: { cash: -1000, revenue: 2400, reputation: 2 } });
    expect(debrief.decisionId).toBe("test");
    expect(debrief.score).toBeGreaterThanOrEqual(0);
    expect(debrief.score).toBeLessThanOrEqual(100);
    expect(debrief.signals.length).toBeGreaterThan(0);
    expect(debrief.lesson.length).toBeGreaterThan(20);
  });
});
