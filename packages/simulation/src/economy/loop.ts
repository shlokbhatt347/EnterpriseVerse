import type { EconomyState, Product, Supplier } from "@enterpriseverse/types";
import { receiveInventory, inventoryValue } from "./inventory";
import { createPurchaseOrder, negotiateUnitCost } from "./procurement";
import { calculateDemand, sellProduct } from "./sales";
import { recordPurchase, recordSale, summarizeAccounting } from "./accounting";

export interface EconomyDayResult {
  economy: EconomyState;
  revenue: number;
  procurementSpend: number;
  unitsSold: number;
  unitsDelivered: number;
}

export function createEconomyState(products: Product[] = [], purchaseOrders = []): EconomyState {
  return { products, purchaseOrders, sales: [], accounting: summarizeAccounting([], [], products) };
}

export function placePurchaseOrder(state: EconomyState, input: { supplier: Supplier; productId: string; quantity: number; day: number; leadDays?: number }): EconomyState {
  const order = createPurchaseOrder({ id: `po-${state.purchaseOrders.length + 1}-d${input.day}`, ...input });
  const cost = order.quantity * negotiateUnitCost(input.supplier, order.quantity, input.supplier.relationship);
  const pricedOrder = { ...order, unitCost: Math.max(1, Math.round(cost / Math.max(1, order.quantity))) };
  return { ...state, purchaseOrders: [...state.purchaseOrders, pricedOrder] };
}

export function advanceEconomyDay(state: EconomyState, day: number, marketDemand = 100, competitorPrice?: number): EconomyDayResult {
  let products = state.products;
  let procurementSpend = 0;
  let unitsDelivered = 0;
  const purchaseEntries = [];
  const purchaseOrders = state.purchaseOrders.map((order) => {
    if (order.status !== "ordered" || order.deliveryDay > day) return order;
    const product = products.find((item) => item.id === order.productId);
    if (!product) return { ...order, status: "cancelled" as const };
    products = products.map((item) => item.id === product.id ? receiveInventory(item, order.quantity) : item);
    procurementSpend += order.quantity * order.unitCost;
    unitsDelivered += order.quantity;
    purchaseEntries.push(recordPurchase(order, day));
    return { ...order, status: "delivered" as const };
  });

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
  const saleEntries = sales.slice(state.sales.length).map((sale) => recordSale(sale, products.find((p) => p.id === sale.productId)?.productionCost ?? 0));
  const ledger = [...state.accounting.ledger, ...purchaseEntries, ...saleEntries];
  const accounting = summarizeAccounting(ledger, sales, products);
  return { economy: { products, purchaseOrders, sales, accounting: { ...accounting, cashIn: accounting.cashIn, cashOut: accounting.cashOut } }, revenue, procurementSpend, unitsSold, unitsDelivered };
}

export function economySnapshot(state: EconomyState): EconomyState {
  return { ...state, accounting: summarizeAccounting(state.accounting.ledger, state.sales, state.products), };
}

export function currentInventoryValue(state: EconomyState): number { return inventoryValue(state.products); }
