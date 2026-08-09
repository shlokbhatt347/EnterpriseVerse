import type { Product, Sale } from "@enterpriseverse/types";
import { removeInventory } from "./inventory";

export function calculateDemand(product: Product, marketDemand = 100, competitorPrice = product.sellingPrice): number {
  const priceRatio = competitorPrice <= 0 ? 1 : Math.max(0.35, Math.min(1.8, competitorPrice / Math.max(1, product.sellingPrice)));
  return Math.max(0, Math.round(product.demandScore * (marketDemand / 100) * priceRatio));
}

export function sellProduct(product: Product, requested: number, day: number, saleId: string): { product: Product; sale: Sale | null } {
  const { product: nextProduct, fulfilled } = removeInventory(product, requested);
  if (fulfilled === 0) return { product: nextProduct, sale: null };
  return {
    product: nextProduct,
    sale: { id: saleId, day, productId: product.id, quantity: fulfilled, unitPrice: product.sellingPrice, total: fulfilled * product.sellingPrice },
  };
}
