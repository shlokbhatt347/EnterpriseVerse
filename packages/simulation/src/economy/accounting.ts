import type { AccountingState, LedgerEntry, Product, PurchaseOrder, Sale } from "@enterpriseverse/types";
import { inventoryValue } from "./inventory";
import { procurementCost } from "./procurement";

/**
 * Phase 1 accounting contract:
 * - cashIn/cashOut represent actual cash movement only.
 * - purchase entries are cash outflows but are not immediately expenses.
 * - sale entries contain revenue (credit) and COGS (debit); only COGS affects gross profit.
 * - operating expenses are explicit expense entries.
 * - openingCash is the external opening balance and is never counted as revenue.
 */
export function emptyAccounting(openingCash = 0): AccountingState {
  return { cashIn: 0, cashOut: 0, grossProfit: 0, netProfit: 0, inventoryValue: 0, ledger: [], openingCash, cashBalance: openingCash };
}

export function recordLedgerEntry(state: AccountingState, entry: LedgerEntry, products: Product[] = []): AccountingState {
  const ledger = [...state.ledger, entry];
  return summarizeAccounting(ledger, [], products, state.openingCash ?? 0);
}

export function recordPurchase(order: PurchaseOrder, day: number): LedgerEntry {
  const amount = Math.max(0, procurementCost(order));
  return { id: `purchase-${order.id}`, day, type: "purchase", description: `Purchase order ${order.id}`, debit: amount, credit: 0 };
}

export function recordSale(sale: Sale, productionCost: number): LedgerEntry {
  const revenue = Math.max(0, sale.total);
  const cogs = Math.max(0, sale.quantity * Math.max(0, productionCost));
  return { id: `sale-${sale.id}`, day: sale.day, type: "sale", description: `Sale ${sale.id}`, debit: cogs, credit: revenue };
}

export function recordExpense(id: string, day: number, description: string, amount: number): LedgerEntry {
  return { id, day, type: "expense", description, debit: Math.max(0, amount), credit: 0 };
}

export function recordCashInflow(id: string, day: number, type: "investment" | "loan" | "other", description: string, amount: number): LedgerEntry {
  return { id, day, type, description, debit: 0, credit: Math.max(0, amount) };
}

export function summarizeAccounting(ledger: LedgerEntry[], sales: Sale[], products: Product[], openingCash = 0): AccountingState {
  let cashIn = 0;
  let cashOut = 0;
  let revenue = 0;
  let cogs = 0;
  let operatingExpenses = 0;

  for (const entry of ledger) {
    const debit = Number.isFinite(entry.debit) ? Math.max(0, entry.debit) : 0;
    const credit = Number.isFinite(entry.credit) ? Math.max(0, entry.credit) : 0;

    if (entry.type === "sale") {
      cashIn += credit;
      revenue += credit;
      cogs += debit;
    } else if (entry.type === "purchase") {
      cashOut += debit;
    } else if (entry.type === "expense") {
      cashOut += debit;
      operatingExpenses += debit;
    } else if (entry.type === "refund") {
      cashOut += debit;
    } else if (entry.type === "investment" || entry.type === "loan" || entry.type === "other") {
      cashIn += credit;
      cashOut += debit;
    }
  }

  // Keep the sales argument for API compatibility. The ledger is authoritative when
  // sale entries exist; otherwise derive gross profit from historical sales.
  if (revenue === 0 && sales.length > 0) {
    const costs = new Map(products.map((product) => [product.id, Math.max(0, product.productionCost)]));
    for (const sale of sales) {
      revenue += Math.max(0, sale.total);
      cogs += Math.max(0, sale.quantity) * (costs.get(sale.productId) ?? 0);
    }
  }

  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - operatingExpenses;
  const cashBalance = openingCash + cashIn - cashOut;

  return { cashIn, cashOut, grossProfit, netProfit, inventoryValue: inventoryValue(products), ledger, openingCash, cashBalance };
}

export function calculateBreakEvenUnits(product: Product, fixedCosts: number): number {
  const margin = product.sellingPrice - product.productionCost;
  return margin <= 0 ? Infinity : Math.ceil(Math.max(0, fixedCosts) / margin);
}

export function reconcileCash(state: AccountingState): number {
  return (state.openingCash ?? 0) + state.cashIn - state.cashOut;
}
