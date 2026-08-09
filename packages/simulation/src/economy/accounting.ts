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
  const cashIn = ledger.reduce((total, entry) => total + entry.credit, 0);
  const cashOut = ledger.reduce((total, entry) => total + entry.debit, 0);
  const grossProfit = sales.reduce((total, sale) => {
    const product = products.find((item) => item.id === sale.productId);
    return total + sale.total - sale.quantity * (product?.productionCost ?? 0);
  }, 0);
  return { cashIn, cashOut, grossProfit, netProfit: cashIn - cashOut, inventoryValue: inventoryValue(products), ledger };
}

export function calculateBreakEvenUnits(product: Product, fixedCosts: number): number {
  const margin = product.sellingPrice - product.productionCost;
  return margin <= 0 ? Infinity : Math.ceil(fixedCosts / margin);
}
