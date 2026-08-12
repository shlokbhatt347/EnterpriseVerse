import { describe, expect, it } from "vitest";
import type { SimulationState } from "@enterpriseverse/types";
import { createBusiness } from "./index";
import {
  addPhase5Contract,
  addPhase5Partnership,
  applyPhase5Acquisition,
  applyPhase5Financing,
  calculatePhase5Snapshot,
  createDefaultPhase5State,
  previewPhase5Acquisition,
  previewPhase5Financing,
  setPhase5ESG,
  setPhase5Regulation,
} from "./phase5";

function makeState(): SimulationState {
  const state = createBusiness({
    name: "Phase Five Labs",
    idea: "A test enterprise",
    industry: "Technology",
    structure: "team",
    founderNames: ["Founder"],
  });
  return { ...state, phase5: createDefaultPhase5State(state) };
}

describe("Phase 5 advanced enterprise strategy", () => {
  it("creates a deterministic strategy state from the existing enterprise", () => {
    const state = makeState();
    const snapshot = calculatePhase5Snapshot(state);
    expect(snapshot.round).toBe("bootstrapped");
    expect(snapshot.founderOwnership).toBe(100);
    expect(snapshot.valuation).toBeGreaterThan(0);
    expect(snapshot.risk.overall).toBeGreaterThanOrEqual(0);
    expect(snapshot.risk.overall).toBeLessThanOrEqual(100);
  });

  it("previews and applies safe debt financing without losing cash integrity", () => {
    const state = makeState();
    const preview = previewPhase5Financing(state, { type: "debt", amount: 10_000, interestRate: 10, termDays: 365 });
    expect(preview.allowed).toBe(true);
    const next = applyPhase5Financing(state, { type: "debt", amount: 10_000, interestRate: 10, termDays: 365 });
    expect(next.business.cash).toBe(state.business.cash + 10_000);
    expect(next.phase5?.debt).toBe(10_000);
  });

  it("protects founder control during equity financing", () => {
    const state = makeState();
    const preview = previewPhase5Financing(state, { type: "equity", amount: 10_000, investorType: "venture_capital" });
    expect(preview.allowed).toBe(true);
    const next = applyPhase5Financing(state, { type: "equity", amount: 10_000, investorType: "venture_capital" });
    expect(next.phase5?.ownershipFounderPercent).toBeGreaterThanOrEqual(55);
    expect(next.phase5?.investors).toHaveLength(1);
  });

  it("rejects an acquisition before the company reaches mature scale", () => {
    const state = makeState();
    const preview = previewPhase5Acquisition(state, {
      targetName: "Target",
      purchasePrice: 10_000,
      targetRevenue: 5_000,
      targetMarketShare: 1,
      synergyScore: 80,
      dueDiligenceScore: 90,
      financingType: "cash",
    });
    expect(preview.allowed).toBe(false);
    expect(preview.reason).toContain("mature company scale");
  });

  it("keeps contracts and partnerships inside the strategy state", () => {
    let state = makeState();
    state = addPhase5Contract(state, { counterparty: "Prime Supplies", type: "supplier", value: 5_000, termDays: 180, penaltyPercent: 5 });
    state = addPhase5Partnership(state, { partner: "Retail Network", strategicValue: 70, annualValue: 8_000, exclusivity: false, termDays: 365 });
    expect(state.phase5?.contracts).toHaveLength(1);
    expect(state.phase5?.partnerships).toHaveLength(1);
  });

  it("normalizes ESG and regulation inputs", () => {
    let state = makeState();
    state = setPhase5ESG(state, { environmental: 110, social: -5, governance: 80, sustainabilityScore: 0 });
    state = setPhase5Regulation(state, { complianceScore: 120, licenceCount: -2, unresolvedIssues: 3.6, jurisdiction: "" });
    expect(state.phase5?.esg.environmental).toBe(100);
    expect(state.phase5?.esg.social).toBe(0);
    expect(state.phase5?.esg.sustainabilityScore).toBe(60);
    expect(state.phase5?.regulation.complianceScore).toBe(100);
    expect(state.phase5?.regulation.licenceCount).toBe(0);
    expect(state.phase5?.regulation.unresolvedIssues).toBe(4);
    expect(state.phase5?.regulation.jurisdiction).toBe("India");
  });
});
