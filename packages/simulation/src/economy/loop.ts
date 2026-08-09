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

export function createEconomyState(products: Product[] = [], purchaseOrders: PurchaseOrder[] = []): EconomyState {
  const firstProduct = products[0];
  return { products, purchaseOrders, sales: [], accounting: summarizeAccounting([], [], products), supplyChain: createSupplyChainState(firstProduct) };
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
  if (primarySupplier) supplyChain = triggerSupplyChainDisruption(supplyChain, day, primarySupplier);

  const purchaseOrders: PurchaseOrder[] = state.purchaseOrders.map((order) => {
    if (order.status !== "ordered" || order.deliveryDay > day) return order;
    const product = products.find((item) => item.id === order.productId);
    if (!product) return { ...order, status: "cancelled" };
    const supplier = suppliers.find((item) => item.id === order.supplierId);
    if ((supplyChain.disruption === "supplier_shortage" || supplyChain.disruption === "supplier_delay") && supplier?.id === primarySupplier?.id) {
      return { ...order, deliveryDay: order.deliveryDay + 1 };
    }
    supplyChain = { ...supplyChain, rawMaterialInventory: supplyChain.rawMaterialInventory + order.quantity };
    procurementSpend += order.quantity * order.unitCost;
    unitsDelivered += order.quantity;
    purchaseEntries.push(recordPurchase(order, day));
    return { ...order, status: "delivered" };
  });

  const firstProduct = products[0];
  if (firstProduct) {
    supplyChain = {
      ...supplyChain,
      productionCostPerUnit: Math.max(1, Math.round(firstProduct.productionCost)),
      productionQuality: firstProduct.quality,
    };
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
  for (const product of products) {
    if (product.status !== "active") continue;
    const demand = calculateDemand(product, marketDemand, competitorPrice ?? product.sellingPrice);
    const result = sellProduct(product, demand, day, `sale-${sales.length + 1}-d${day}`);
    products = products.map((item) => item.id === product.id ? result.product : item);
    if (result.sale) {
      sales.push(result.sale);
      revenue += result.sale.total;
      unitsSold += result.sale.quantity;
    }
  }

  const saleEntries: LedgerEntry[] = sales.slice(state.sales.length).map((sale) => {
    const product = products.find((item) => item.id === sale.productId);
    return recordSale(sale, product?.productionCost ?? 0);
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

  const ledger: LedgerEntry[] = [...state.accounting.ledger, ...purchaseEntries, ...saleEntries];
  const accounting = summarizeAccounting(ledger, sales, products);
  supplyChain = { ...supplyChain, overstockUnits: Math.max(0, products.reduce((total, product) => total + product.inventory, 0) - supplyChain.targetStock) };

  return {
    economy: { products, purchaseOrders, sales, accounting, supplyChain },
    revenue,
    procurementSpend,
    unitsSold,
    unitsDelivered,
    unitsProduced: productionResult.producedUnits,
    supplyChainRisk: evaluateSupplyChainRisk(supplyChain, suppliers),
  };
}

export function economySnapshot(state: EconomyState): EconomyState {
  return { ...state, accounting: summarizeAccounting(state.accounting.ledger, state.sales, state.products) };
}

export function currentInventoryValue(state: EconomyState): number {
  return inventoryValue(state.products);
}
