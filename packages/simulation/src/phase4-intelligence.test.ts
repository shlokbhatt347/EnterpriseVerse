import { describe, expect, it } from "vitest";
import { createBusiness } from "./index";
import { buildPhase4DecisionBriefs, buildPhase4IntelligenceReport, buildPhase4StrategicPlan, buildPhase4Timeline, phase4MetricBand } from "./phase4-intelligence";
import { projectPhase4State } from "./phase4-projection";

describe("Phase 4 intelligence", () => {
  const state = () => createBusiness({ name: "Intel Co", idea: "Useful product", industry: "technology", structure: "team", founderNames: ["A", "B"] });

  it("builds a read-only intelligence report from authoritative state", () => {
    const s = state(); const before = JSON.stringify(s); const report = buildPhase4IntelligenceReport(s);
    expect(JSON.stringify(s)).toBe(before);
    expect(report.finance.cash.confidence).toBe("known");
    expect(report.market.demand.confidence).toBe("estimated");
    expect(report.signals.length).toBeGreaterThan(0);
  });

  it("builds decision briefs with uncertainty and affected systems", () => {
    const s = state();
    const choices = s.events.flatMap((event) => event.choices);
    const briefs = buildPhase4DecisionBriefs(s, choices.slice(0, 3));
    expect(briefs.length).toBeGreaterThan(0);
    expect(briefs[0].affectedSystems.length).toBeGreaterThan(0);
    expect(briefs[0].uncertainty).toContain("actual outcomes");
  });

  it("supports explicit strategic horizons", () => {
    const s = state();
    expect(buildPhase4StrategicPlan(s, "innovation").horizon).toBe("long_term");
    expect(buildPhase4StrategicPlan(s, "profitability").focus).toContain("pricing");
    expect(buildPhase4StrategicPlan(s, "customer_value").focus).toContain("retention" as never);
  });

  it("produces a bounded, ordered decision history", () => {
    const s = state();
    const history = buildPhase4Timeline(s);
    for (let i = 1; i < history.length; i += 1) expect(history[i - 1].day).toBeGreaterThanOrEqual(history[i].day);
  });

  it("classifies metrics consistently", () => {
    expect(phase4MetricBand(10)).toBe("critical");
    expect(phase4MetricBand(50)).toBe("watch");
    expect(phase4MetricBand(90)).toBe("healthy");
  });

  it("keeps projection and intelligence aligned", () => {
    const s = state(); const p = projectPhase4State(s); const r = buildPhase4IntelligenceReport(s);
    expect(r.finance.cash.value).toBe(p.finance.cash);
    expect(r.customers.count).toBe(p.customers.count);
  });
});
