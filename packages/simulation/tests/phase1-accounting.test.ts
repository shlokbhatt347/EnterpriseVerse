import { describe, expect, it } from "vitest";
import type { Product } from "@enterpriseverse/types";
import { emptyAccounting, recordExpense, recordPurchase, recordSale, summarizeAccounting, reconcileCash } from "../src/economy/accounting";
import { validateAccountingState, validateEconomyState } from "../src/invariants";

const product: Product = { id: "p1", name: "Core", category: "starter", sellingPrice: 120, productionCost: 60, inventory: 10, quality: 70, demandScore: 65, status: "active" };

describe("Phase 1 accounting contract", () => {
  it("does not treat COGS as a second cash outflow", () => {
    const sale = { id: "s1", day: 1, productId: product.id, quantity: 2, unitPrice: 120, total: 240 };
    const ledger = [recordSale(sale, product.productionCost)];
    const accounting = summarizeAccounting(ledger, [sale], [product], 1_000);
    expect(accounting.cashIn).toBe(240);
    expect(accounting.cashOut).toBe(0);
    expect(accounting.grossProfit).toBe(120);
    expect(reconcileCash(accounting)).toBe(1_240);
  });

  it("treats procurement as cash movement, not immediate expense", () => {
    const order = { id: "po1", supplierId: "s1", productId: product.id, quantity: 5, unitCost: 60, orderDay: 1, deliveryDay: 2, status: "ordered" as const };
    const accounting = summarizeAccounting([recordPurchase(order, 1)], [], [product], 1_000);
    expect(accounting.cashOut).toBe(300);
    expect(accounting.grossProfit).toBe(0);
    expect(accounting.netProfit).toBe(0);
    expect(accounting.cashBalance).toBe(700);
  });

  it("separates operating expenses from inventory purchases", () => {
    const accounting = summarizeAccounting([recordExpense("e1", 1, "rent", 100)], [], [product], 1_000);
    expect(accounting.cashOut).toBe(100);
    expect(accounting.netProfit).toBe(-100);
    expect(accounting.cashBalance).toBe(900);
  });

  it("rejects duplicate ledger ids and invalid money", () => {
    const state = { ...emptyAccounting(100), ledger: [{ id: "x", day: 1, type: "expense" as const, description: "x", debit: 10, credit: 0 }, { id: "x", day: 1, type: "expense" as const, description: "x", debit: -1, credit: 0 }] };
    const failures = validateAccountingState(state);
    expect(failures.some((failure) => failure.code.includes("duplicate-ledger"))).toBe(true);
    expect(failures.some((failure) => failure.code.includes("debit-x"))).toBe(true);
  });

  it("keeps product inventory invariants explicit", () => {
    const economy = { products: [{ ...product, inventory: -1 }], purchaseOrders: [], sales: [], accounting: emptyAccounting(0) };
    expect(validateEconomyState(economy).some((failure) => failure.code === "economy.inventory-p1")).toBe(true);
  });
});
