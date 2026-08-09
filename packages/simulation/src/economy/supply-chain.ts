import type { Product, ProductionBatch, Supplier, SupplyChainDisruption, SupplyChainState } from "@enterpriseverse/types";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export function createSupplyChainState(product?: Product, productionCapacity = 20): SupplyChainState {
  const capacity = Math.max(1, Math.floor(productionCapacity));
  const initialInventory = Math.max(0, Math.floor(product?.inventory ?? 0));
  return {
    rawMaterialInventory: initialInventory,
    reorderPoint: Math.max(10, capacity),
    targetStock: Math.max(30, capacity * 3),
    productionCapacity: capacity,
    productionCostPerUnit: Math.max(1, Math.round(product?.productionCost ?? 60)),
    productionQuality: clamp(product?.quality ?? 70),
    pendingProduction: [],
    disruption: "none",
    disruptionDaysRemaining: 0,
    stockoutDays: 0,
    overstockUnits: 0,
  };
}

export function selectSupplier(suppliers: Supplier[], quantity: number): Supplier | undefined {
  const required = Math.max(0, Math.floor(quantity));
  return [...suppliers]
    .filter((supplier) => supplier.availableUnits >= required && supplier.reliability > 0)
    .sort((a, b) => {
      const score = (supplier: Supplier) => supplier.unitCost * 0.55 - supplier.reliability * 0.25 - supplier.relationship * 0.2;
      return score(a) - score(b);
    })[0] ?? [...suppliers].filter((supplier) => supplier.reliability > 0).sort((a, b) => a.unitCost - b.unitCost)[0];
}

export function queueProduction(
  state: SupplyChainState,
  product: Product,
  day: number,
  requestedUnits?: number,
): { state: SupplyChainState; batch?: ProductionBatch } {
  const availableCapacity = Math.max(0, state.productionCapacity - state.pendingProduction.reduce((total, batch) => total + batch.plannedUnits, 0));
  const units = Math.min(state.rawMaterialInventory, availableCapacity, Math.max(0, Math.floor(requestedUnits ?? state.productionCapacity)));
  if (units <= 0) return { state };

  const batch: ProductionBatch = {
    id: `batch-${day}-${state.pendingProduction.length + 1}`,
    productId: product.id,
    plannedUnits: units,
    producedUnits: 0,
    unitCost: state.productionCostPerUnit,
    quality: state.productionQuality,
    startDay: day,
    completionDay: day + 1,
    status: "queued",
  };
  return {
    state: { ...state, rawMaterialInventory: state.rawMaterialInventory - units, pendingProduction: [...state.pendingProduction, batch] },
    batch,
  };
}

export function advanceSupplyChainDay(
  state: SupplyChainState,
  products: Product[],
  day: number,
): { state: SupplyChainState; products: Product[]; producedUnits: number; disruption: SupplyChainDisruption } {
  let disruption = state.disruption;
  let remaining = state.disruptionDaysRemaining;
  if (remaining > 0) remaining -= 1;
  if (remaining === 0) disruption = "none";

  let nextProducts = products;
  let producedUnits = 0;
  const pending = state.pendingProduction.map((batch) => {
    if (batch.completionDay > day) return batch;
    const efficiency = disruption === "quality_issue" ? 0.9 : disruption === "logistics_delay" ? 0.85 : 1;
    const units = Math.max(0, Math.floor(batch.plannedUnits * efficiency));
    nextProducts = nextProducts.map((product) => product.id === batch.productId
      ? { ...product, inventory: product.inventory + units, productionCost: batch.unitCost, quality: clamp(batch.quality - (units < batch.plannedUnits ? 3 : 0)) }
      : product);
    producedUnits += units;
    return { ...batch, producedUnits: units, status: "completed" as const };
  });

  const activePending = pending.filter((batch) => batch.status !== "completed");
  const firstProduct = nextProducts[0];
  const totalFinished = nextProducts.reduce((total, product) => total + product.inventory, 0);
  const overstockUnits = Math.max(0, totalFinished - state.targetStock);
  const stockoutDays = firstProduct && firstProduct.inventory === 0 ? state.stockoutDays + 1 : state.stockoutDays;

  return {
    state: { ...state, pendingProduction: activePending, disruption, disruptionDaysRemaining: remaining, stockoutDays, overstockUnits },
    products: nextProducts,
    producedUnits,
    disruption,
  };
}

export function evaluateSupplyChainRisk(state: SupplyChainState, suppliers: Supplier[]): number {
  if (suppliers.length === 0) return 100;
  const reliability = suppliers.reduce((sum, supplier) => sum + supplier.reliability, 0) / suppliers.length;
  const concentration = suppliers.length === 1 ? 25 : suppliers.length === 2 ? 10 : 0;
  const stockBuffer = state.targetStock <= 0 ? 0 : Math.min(25, (state.rawMaterialInventory / state.targetStock) * 25);
  return clamp(Math.round(100 - reliability + concentration - stockBuffer));
}

export function triggerSupplyChainDisruption(state: SupplyChainState, day: number, supplier: Supplier): SupplyChainState {
  const reliability = clamp(supplier.reliability);
  const cycle = day + supplier.id.length * 3;
  if (cycle % 17 !== 0 || reliability >= 80) return state;
  const disruption: SupplyChainDisruption = reliability < 60 ? "supplier_shortage" : "supplier_delay";
  return { ...state, disruption, disruptionDaysRemaining: disruption === "supplier_shortage" ? 2 : 1, lastDisruptionDay: day };
}
