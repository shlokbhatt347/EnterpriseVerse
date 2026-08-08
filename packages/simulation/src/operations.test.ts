import { describe, expect, it } from "vitest";
import { applyBusinessAction, calculateKpis, createBusiness } from "./index";

describe("practical business operations", () => {
  const createState = () => createBusiness({
    name: "Test Enterprise",
    idea: "Solve a real customer problem",
    industry: "Technology",
    structure: "sole_trader",
    founderNames: ["Founder"],
  });

  it("changes price without changing cash", () => {
    const state = createState();
    const next = applyBusinessAction(state, { type: "set_price", price: 180 });
    expect(next.operations?.price).toBe(180);
    expect(next.business.cash).toBe(state.business.cash);
  });

  it("makes marketing a real cash decision", () => {
    const state = createState();
    const next = applyBusinessAction(state, { type: "marketing", budget: 1000 });
    expect(next.business.cash).toBe(19_000);
    expect(next.business.expenses).toBe(1_000);
    expect(next.operations?.brandAwareness).toBeGreaterThan(10);
  });

  it("makes inventory and hiring affect operations", () => {
    const state = createState();
    const stocked = applyBusinessAction(state, { type: "restock", units: 10 });
    const hired = applyBusinessAction(stocked, { type: "hire", employees: 2 });
    expect(hired.business.inventory).toBe(30);
    expect(hired.operations?.employees).toBe(3);
    expect(hired.operations?.productionCapacity).toBe(36);
  });

  it("supports financing and repayment", () => {
    const state = createState();
    const borrowed = applyBusinessAction(state, { type: "loan", amount: 10_000 });
    expect(borrowed.business.cash).toBe(30_000);
    expect(borrowed.operations?.debt).toBe(10_000);

    const repaid = applyBusinessAction(borrowed, { type: "repay_loan", amount: 4_000 });
    expect(repaid.business.cash).toBe(26_000);
    expect(repaid.operations?.debt).toBe(6_000);
  });

  it("calculates management KPIs", () => {
    const state = createState();
    const kpis = calculateKpis(state);
    expect(kpis.price).toBe(120);
    expect(kpis.quality).toBe(50);
    expect(kpis.productionCapacity).toBe(20);
    expect(kpis.debt).toBe(0);
  });
});
