import { describe, expect, it } from "vitest";
import { createProduct } from "./product";
import { createSupplyChainState, evaluateSupplyChainRisk, queueProduction, selectSupplier } from "./supply-chain";

describe("phase 3 supply chain", () => {
  const product = createProduct({
    name: "Core Product",
    category: "starter",
    sellingPrice: 120,
    productionCost: 60,
    quality: 70,
    demandScore: 65,
    inventory: 20,
  });

  it("selects a viable supplier using cost, reliability and relationship", () => {
    const supplier = selectSupplier([
      { id: "a", name: "Reliable", reliability: 90, unitCost: 70, relationship: 80, availableUnits: 100 },
      { id: "b", name: "Cheap", reliability: 55, unitCost: 45, relationship: 40, availableUnits: 100 },
    ], 20);
    expect(supplier?.id).toBe("a");
  });

  it("never queues production above material or capacity limits", () => {
    const state = createSupplyChainState(product, 10);
    const result = queueProduction(state, product, 2, 50);
    expect(result.batch?.plannedUnits).toBe(10);
    expect(result.state.rawMaterialInventory).toBe(10);
  });

  it("calculates higher risk for weaker supplier resilience", () => {
    const state = createSupplyChainState(product, 20);
    const risk = evaluateSupplyChainRisk(state, [
      { id: "a", name: "Weak", reliability: 45, unitCost: 50, relationship: 30, availableUnits: 100 },
    ]);
    expect(risk).toBeGreaterThan(40);
  });
});
