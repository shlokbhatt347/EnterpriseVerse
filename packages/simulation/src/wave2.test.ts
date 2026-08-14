import { describe, expect, it } from "vitest";
import { buildAttentionSignals, buildCausalChain, buildDecisionMemory, buildNotifications, buildWave2Snapshot, searchEnterprise, compareWave2Scenario, createBusiness } from "./index";

const input = { name: "Wave Two", idea: "A useful product", industry: "Technology", structure: "sole_trader" as const, founderNames: ["Founder"] };

describe("Wave 2 intelligence services", () => {
  it("builds ranked attention from live simulation state", () => {
    const state = createBusiness(input);
    const signals = buildAttentionSignals(state);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.every((signal) => signal.score >= 25)).toBe(true);
    expect(signals).toEqual([...signals].sort((a, b) => b.score - a.score || b.day - a.day));
  });

  it("builds explainable causal chains", () => {
    const state = createBusiness(input);
    expect(buildCausalChain(state, "cash").at(-1)?.id).toBe("runway");
    expect(buildCausalChain(state, "revenue").at(-1)?.id).toBe("revenue");
    expect(buildCausalChain(state, "market").at(-1)?.id).toBe("share");
  });

  it("preserves decision memory and notification priority", () => {
    const state = createBusiness(input);
    const decisions = buildDecisionMemory(state);
    const notifications = buildNotifications(state);
    expect(decisions).toEqual([]);
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications.every((n) => ["critical", "high", "medium", "low"].includes(n.priority))).toBe(true);
  });

  it("searches across enterprise entities and metrics", () => {
    const state = createBusiness(input);
    expect(searchEnterprise(state, "Mira").some((result) => result.type === "customer")).toBe(true);
    expect(searchEnterprise(state, "supplier").length).toBeGreaterThan(0);
    expect(searchEnterprise(state, "cash").some((result) => result.type === "metric")).toBe(true);
    expect(searchEnterprise(state, "")).toEqual([]);
  });

  it("keeps what-if analysis non-mutating and returns a complete snapshot", () => {
    const state = createBusiness(input);
    const cashBefore = state.business.cash;
    const scenario = compareWave2Scenario(state, { marketingBudget: 2000, qualityInvestment: 1000 });
    expect(state.business.cash).toBe(cashBefore);
    expect(Number.isFinite(scenario.projected.cash)).toBe(true);
    const snapshot = buildWave2Snapshot(state);
    expect(snapshot.day).toBe(state.business.day);
    expect(snapshot.attention.length).toBeGreaterThan(0);
    expect(snapshot.causality.length).toBeGreaterThan(0);
  });
});
