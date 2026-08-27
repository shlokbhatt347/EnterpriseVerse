import { describe, expect, it } from "vitest";
import { createBusiness } from "../src/index";
import { validateSimulationState } from "../src/phase1";

function state() {
  return createBusiness({
    name: "Invariant Co",
    idea: "Reliable product",
    industry: "technology",
    structure: "sole_trader",
    founderNames: ["Founder"],
  });
}

describe("phase 1 hard invariants", () => {
  it("rejects non-finite business money", () => {
    const candidate = state();
    candidate.business.cash = Number.NaN;
    expect(validateSimulationState(candidate).some((failure) => failure.code === "cash-negative")).toBe(true);
  });

  it("rejects duplicate ledger identifiers", () => {
    const candidate = state();
    candidate.economy!.accounting.ledger = [
      { id: "duplicate", day: 1, type: "expense", description: "A", debit: 1, credit: 0 },
      { id: "duplicate", day: 1, type: "expense", description: "B", debit: 1, credit: 0 },
    ];
    expect(validateSimulationState(candidate).some((failure) => failure.code === "accounting.duplicate-ledger-duplicate")).toBe(true);
  });

  it("rejects an unreconciled accounting cash balance", () => {
    const candidate = state();
    candidate.economy!.accounting.cashBalance = 999;
    expect(validateSimulationState(candidate).some((failure) => failure.code === "accounting.cash-reconciliation")).toBe(true);
  });

  it("rejects invalid product bounds", () => {
    const candidate = state();
    candidate.economy!.products[0].quality = 101;
    expect(validateSimulationState(candidate).some((failure) => failure.code === "economy.quality-" + candidate.economy!.products[0].id)).toBe(true);
  });
});
