import type { AccountingState, LedgerEntry, Product } from "@enterpriseverse/types";
import { inventoryValue } from "./inventory";

export function emptyAccounting(): AccountingState {
  return { cashIn: 0, cashOut: 0, grossProfit: 0, netProfit: 0, inventoryValue: 0, ledger: [] };
}

export function recordLedgerEntry(state: AccountingState, entry: LedgerEntry, products: Product[] = []): AccountingState {
  const cashIn = state.cashIn + entry.credit;
  const cashOut = state.cashOut + entry.debit;
  return { ...state, cashIn, cashOut, netProfit: cashIn - cashOut, grossProfit: cashIn - cashOut, inventoryValue: inventoryValue(products), ledger: [...state.ledger, entry] };
}

export function calculateBreakEvenUnits(product: Product, fixedCosts: number): number {
  const margin = product.sellingPrice - product.productionCost;
  return margin <= 0 ? Infinity : Math.ceil(fixedCosts / margin);
}
