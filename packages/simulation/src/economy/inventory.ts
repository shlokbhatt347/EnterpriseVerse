import type { Product } from "@enterpriseverse/types";

export function receiveInventory(product: Product, quantity: number): Product {
  return { ...product, inventory: Math.max(0, product.inventory + Math.max(0, Math.floor(quantity))) };
}

export function removeInventory(product: Product, quantity: number): { product: Product; fulfilled: number } {
  const fulfilled = Math.min(product.inventory, Math.max(0, Math.floor(quantity)));
  return { product: { ...product, inventory: product.inventory - fulfilled }, fulfilled };
}

export function inventoryValue(products: Product[]): number {
  return products.reduce((total, product) => total + product.inventory * product.productionCost, 0);
}
