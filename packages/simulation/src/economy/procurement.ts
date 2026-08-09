import type { PurchaseOrder, Supplier } from "@enterpriseverse/types";

export function createPurchaseOrder(input: { id: string; supplier: Supplier; productId: string; quantity: number; orderDay: number; leadDays?: number }): PurchaseOrder {
  const quantity = Math.max(0, Math.floor(input.quantity));
  const leadDays = Math.max(1, Math.floor(input.leadDays ?? Math.ceil(3 + (100 - input.supplier.reliability) / 20)));
  return { id: input.id, supplierId: input.supplier.id, productId: input.productId, quantity, unitCost: input.supplier.unitCost, orderDay: input.orderDay, deliveryDay: input.orderDay + leadDays, status: "ordered" };
}

export function procurementCost(order: PurchaseOrder): number {
  return order.quantity * order.unitCost;
}

export function negotiateUnitCost(supplier: Supplier, quantity: number, relationship: number): number {
  const volumeDiscount = quantity >= 50 ? 0.04 : quantity >= 20 ? 0.02 : 0;
  const relationshipDiscount = relationship >= 75 ? 0.03 : relationship >= 55 ? 0.01 : 0;
  return Math.max(1, Math.round(supplier.unitCost * (1 - volumeDiscount - relationshipDiscount)));
}
