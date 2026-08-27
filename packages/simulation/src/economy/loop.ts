import type { EconomyState, LedgerEntry, Product, PurchaseOrder, Supplier } from "@enterpriseverse/types";
import { inventoryValue } from "./inventory";
import { createPurchaseOrder, negotiateUnitCost } from "./procurement";
import { calculateDemand, sellProduct } from "./sales";
import { recordPurchase, recordSale, summarizeAccounting } from "./accounting";
import { advanceSupplyChainDay, createSupplyChainState, evaluateSupplyChainRisk, queueProduction, selectSupplier, triggerSupplyChainDisruption } from "./supply-chain";

export interface EconomyDayResult {
  economy: EconomyState;
  revenue: number;
  procurementSpend: number;
  unitsSold: number;
  unitsDelivered: number;
  unitsProduced: number;
  supplyChainRisk: number;
}

export function createEconomyState(products: Product[] = [], purchaseOrders: PurchaseOrder[] = [], openingCash = 0): EconomyState {
  const firstProduct = products[0];
  return { products, purchaseOrders, sales: [], accounting: summarizeAccounting([], [], products, Math.max(0, openingCash)), supplyChain: createSupplyChainState(firstProduct) };
}

export function placePurchaseOrder(
  state: EconomyState,
  input: { supplier: Supplier; productId: string; quantity: number; day: number; leadDays?: number },
): EconomyState {
  const orderId = `po-${state.purchaseOrders.length + 1}-d${input.day}`;
  const order = createPurchaseOrder({ id: orderId, supplier: input.supplier, productId: input.productId, quantity: input.quantity, orderDay: input.day, leadDays: input.leadDays });
  const unitCost = negotiateUnitCost(input.supplier, order.quantity, input.supplier.relationship);
  return { ...state, purchaseOrders: [...state.purchaseOrders, { ...order, unitCost }] };
}

export function advanceEconomyDay(
  state: EconomyState,
  day: number,
  marketDemand = 100,
  competitorPrice?: number,
  suppliers: Supplier[] = [],
): EconomyDayResult {
  let products = state.products;
  let procurementSpend = 0;
  let unitsDelivered = 0;
  const purchaseEntries: LedgerEntry[] = [];
  let supplyChain = state.supplyChain ?? createSupplyChainState(products[0]);

  const primarySupplier = suppliers[0];
  const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  const productById = new Map(products.map((product) => [product.id, product]));

  if (primarySupplier) supplyChain = triggerSupplyChainDisruption(supplyChain, day, primarySupplier);

  const purchaseOrders: PurchaseOrder[] = state.purchaseOrders.map((order) => {
    if (order.status !== "ordered" || order.deliveryDay > day) return order;
    if (!productById.has(order.productId)) return { ...order, status: "cancelled" };
    const supplier = supplierById.get(order.supplierId);
    if ((supplyChain.disruption === "supplier_shortage" || supplyChain.disruption === "supplier_delay") && supplier?.id === primarySupplier?.id) return { ...order, deliveryDay: order.deliveryDay + 1 };
    supplyChain = { ...supplyChain, rawMaterialInventory: supplyChain.rawMaterialInventory + order.quantity };
    procurementSpend += order.quantity * order.unitCost;
    unitsDelivered += order.quantity;
    purchaseEntries.push(recordPurchase(order, day));
    return { ...order, status: "delivered" };
  });

  const firstProduct = products[0];
  if (firstProduct) {
    supplyChain = { ...supplyChain, productionCostPerUnit: Math.max(1, Math.round(firstProduct.productionCost)), productionQuality: firstProduct.quality };
    const finishedInventory = products.reduce((total, product) => total + product.inventory, 0);
    const outstandingUnits = purchaseOrders.filter((order) => order.status === "ordered").reduce((total, order) => total + order.quantity, 0);
    const desiredProduction = Math.max(0, supplyChain.targetStock - finishedInventory - outstandingUnits);
    supplyChain = queueProduction(supplyChain, firstProduct, day, desiredProduction).state;
  }

  const productionResult = advanceSupplyChainDay(supplyChain, products, day);
  supplyChain = productionResult.state;
  products = productionResult.products;

  const sales = [...state.sales];
  let revenue = 0;
  let unitsSold = 0;
  const saleEntries: LedgerEntry[] = [];

  products = products.map((product) => {
    if (product.status !== "active") return product;
    const demand = calculateDemand(product, marketDemand, competitorPrice ?? product.sellingPrice);
    const result = sellProduct(product, demand, day, `sale-${sales.length + 1}-d${day}`);
    if (!result.sale) return result.product;
    sales.push(result.sale);
    revenue += result.sale.total;
    unitsSold += result.sale.quantity;
    saleEntries.push(recordSale(result.sale, result.product.productionCost));
    return result.product;
  });

  if (primarySupplier && supplyChain.rawMaterialInventory <= supplyChain.reorderPoint) {
    const openOrders = purchaseOrders.filter((order) => order.status === "ordered").reduce((total, order) => total + order.quantity, 0);
    const reorderQuantity = Math.max(0, supplyChain.targetStock - supplyChain.rawMaterialInventory - openOrders);
    const selectedSupplier = selectSupplier(suppliers, reorderQuantity);
    if (selectedSupplier && reorderQuantity > 0 && products[0]) {
      const order = createPurchaseOrder({ id: `po-auto-${purchaseOrders.length + 1}-d${day}`, supplier: selectedSupplier, productId: products[0].id, quantity: reorderQuantity, orderDay: day });
      const unitCost = negotiateUnitCost(selectedSupplier, order.quantity, selectedSupplier.relationship);
      purchaseOrders.push({ ...order, unitCost });
    }
  }

  const newLedgerEntries = [...purchaseEntries, ...saleEntries];
  const ledger = newLedgerEntries.length === 0 ? state.accounting.ledger : [...state.accounting.ledger, ...newLedgerEntries];
  const accounting = summarizeAccounting(ledger, sales, products, state.accounting.openingCash ?? 0);

  supplyChain = { ...supplyChain, overstockUnits: Math.max(0, products.reduce((total, product) => total + product.inventory, 0) - supplyChain.targetStock) };

  return { economy: { products, purchaseOrders, sales, accounting, supplyChain }, revenue, procurementSpend, unitsSold, unitsDelivered, unitsProduced: productionResult.producedUnits, supplyChainRisk: evaluateSupplyChainRisk(supplyChain, suppliers) };
}

export function economySnapshot(state: EconomyState): EconomyState {
  return { ...state, accounting: summarizeAccounting(state.accounting.ledger, state.sales, state.products, state.accounting.openingCash ?? 0) };
}

export function currentInventoryValue(state: EconomyState): number {
  return inventoryValue(state.products);
}
