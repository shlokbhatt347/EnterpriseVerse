import { describe, expect, it } from "vitest";
import { createBusiness, advanceDay } from "./index";
import { calculatePhase7Score, getPhase7Achievements, getPhase7CompanySnapshot } from "./phase7";

describe("Phase 7 endgame", () => {
  it("produces a deterministic company snapshot and score", () => {
    const state = createBusiness({ name: "Apex Labs", idea: "Better work tools", industry: "Technology", structure: "team", founderNames: ["Founder"] });
    const snapshot = getPhase7CompanySnapshot(state);
    const score = calculatePhase7Score(snapshot, state);
    expect(snapshot.companyName).toBe("Apex Labs");
    expect(snapshot.outcome).toBe("continue");
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it("changes as the real simulation advances", () => {
    const initial = createBusiness({ name: "Nova", idea: "Useful products", industry: "Retail", structure: "sole_trader", founderNames: ["Founder"] });
    const after = advanceDay(initial);
    expect(after.business.day).toBe(initial.business.day + 1);
    const beforeScore = calculatePhase7Score(getPhase7CompanySnapshot(initial), initial).overall;
    const afterScore = calculatePhase7Score(getPhase7CompanySnapshot(after), after).overall;
    expect(Number.isFinite(beforeScore)).toBe(true);
    expect(Number.isFinite(afterScore)).toBe(true);
  });

  it("unlocks achievements from actual company state", () => {
    const state = createBusiness({ name: "Growth Co", idea: "Scale a business", industry: "Services", structure: "team", founderNames: ["Founder"] });
    const snapshot = getPhase7CompanySnapshot(state);
    const score = calculatePhase7Score(snapshot, state);
    const achievements = getPhase7Achievements(snapshot, score, state);
    expect(Array.isArray(achievements)).toBe(true);
    expect(achievements.every((item) => ["bronze", "silver", "gold", "platinum"].includes(item.tier))).toBe(true);
  });
});
