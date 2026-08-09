import type { Product } from "@enterpriseverse/types";

export function createProduct(input: Omit<Product, "id" | "inventory" | "status"> & { id?: string; inventory?: number }): Product {
  return {
    id: input.id ?? `product-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: input.name,
    category: input.category,
    sellingPrice: Math.max(0, input.sellingPrice),
    productionCost: Math.max(0, input.productionCost),
    inventory: Math.max(0, input.inventory ?? 0),
    quality: Math.max(0, Math.min(100, input.quality)),
    demandScore: Math.max(0, Math.min(100, input.demandScore)),
    status: "active",
  };
}

export function calculateUnitMargin(product: Product): number {
  return product.sellingPrice - product.productionCost;
}

export function calculateMarginPercent(product: Product): number {
  return product.sellingPrice <= 0 ? 0 : (calculateUnitMargin(product) / product.sellingPrice) * 100;
}
