import type { AccountingState, LedgerEntry, Product, PurchaseOrder, Sale } from "@enterpriseverse/types";
import { inventoryValue } from "./inventory";
import { procurementCost } from "./procurement";

export function emptyAccounting(): AccountingState {
  return { cashIn: 0, cashOut: 0, grossProfit: 0, netProfit: 0, inventoryValue: 0, ledger: [] };
}

export function recordLedgerEntry(state: AccountingState, entry: LedgerEntry, products: Product[] = []): AccountingState {
  const cashIn = state.cashIn + entry.credit;
  const cashOut = state.cashOut + entry.debit;
  return { ...state, cashIn, cashOut, netProfit: cashIn - cashOut, grossProfit: cashIn - cashOut, inventoryValue: inventoryValue(products), ledger: [...state.ledger, entry] };
}

export function recordPurchase(order: PurchaseOrder, day: number): LedgerEntry {
  return { id: `purchase-${order.id}`, day, type: "purchase", description: `Purchase order ${order.id}`, debit: procurementCost(order), credit: 0 };
}

export function recordSale(sale: Sale, productionCost: number): LedgerEntry {
  return { id: `sale-${sale.id}`, day: sale.day, type: "sale", description: `Sale ${sale.id}`, debit: sale.quantity * productionCost, credit: sale.total };
}

export function summarizeAccounting(ledger: LedgerEntry[], sales: Sale[], products: Product[]): AccountingState {
  let cashIn = 0;
  let cashOut = 0;
  for (const entry of ledger) {
    cashIn += entry.credit;
    cashOut += entry.debit;
  }

  // Preserve the previous calculation while replacing one products.find() per sale
  // with a single product-id lookup map: O(sales + products) instead of O(sales * products).
  const costs = new Map(products.map((product) => [product.id, product.productionCost]));
  let grossProfit = 0;
  for (const sale of sales) {
    grossProfit += sale.total - sale.quantity * (costs.get(sale.productId) ?? 0);
  }

  return {
    cashIn,
    cashOut,
    grossProfit,
    netProfit: cashIn - cashOut,
    inventoryValue: inventoryValue(products),
    ledger,
  };
}

export function calculateBreakEvenUnits(product: Product, fixedCosts: number): number {
  const margin = product.sellingPrice - product.productionCost;
  return margin <= 0 ? Infinity : Math.ceil(fixedCosts / margin);
}
