import type { EconomyState, LedgerEntry, Product, PurchaseOrder, Supplier } from "@enterpriseverse/types";
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

export function createEconomyState(products: Product[] = [], purchaseOrders: PurchaseOrder[] = []): EconomyState {
  return {
    products,
    purchaseOrders,
    sales: [],
    accounting: summarizeAccounting([], [], products),
  };
}

export function placePurchaseOrder(
  state: EconomyState,
  input: { supplier: Supplier; productId: string; quantity: number; day: number; leadDays?: number },
): EconomyState {
  const orderId = `po-${state.purchaseOrders.length + 1}-d${input.day}`;
  const order = createPurchaseOrder({
    id: orderId,
    supplier: input.supplier,
    productId: input.productId,
    quantity: input.quantity,
    orderDay: input.day,
    leadDays: input.leadDays,
  });
  const unitCost = negotiateUnitCost(input.supplier, order.quantity, input.supplier.relationship);
  const pricedOrder: PurchaseOrder = { ...order, unitCost };
  return { ...state, purchaseOrders: [...state.purchaseOrders, pricedOrder] };
}

export function advanceEconomyDay(
  state: EconomyState,
  day: number,
  marketDemand = 100,
  competitorPrice?: number,
): EconomyDayResult {
  let products = state.products;
  let procurementSpend = 0;
  let unitsDelivered = 0;
  const purchaseEntries: LedgerEntry[] = [];

  const purchaseOrders: PurchaseOrder[] = state.purchaseOrders.map((order) => {
    if (order.status !== "ordered" || order.deliveryDay > day) return order;

    const product = products.find((item) => item.id === order.productId);
    if (!product) return { ...order, status: "cancelled" };

    products = products.map((item) =>
      item.id === product.id ? receiveInventory(item, order.quantity) : item,
    );
    procurementSpend += order.quantity * order.unitCost;
    unitsDelivered += order.quantity;
    purchaseEntries.push(recordPurchase(order, day));

    return { ...order, status: "delivered" };
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

  const saleEntries: LedgerEntry[] = sales.slice(state.sales.length).map((sale) => {
    const product = products.find((item) => item.id === sale.productId);
    return recordSale(sale, product?.productionCost ?? 0);
  });

  const ledger: LedgerEntry[] = [...state.accounting.ledger, ...purchaseEntries, ...saleEntries];
  const accounting = summarizeAccounting(ledger, sales, products);

  return {
    economy: { products, purchaseOrders, sales, accounting },
    revenue,
    procurementSpend,
    unitsSold,
    unitsDelivered,
  };
}

export function economySnapshot(state: EconomyState): EconomyState {
  return {
    ...state,
    accounting: summarizeAccounting(state.accounting.ledger, state.sales, state.products),
  };
}

export function currentInventoryValue(state: EconomyState): number {
  return inventoryValue(state.products);
}
