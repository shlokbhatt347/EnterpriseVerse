import type { Business, CustomerAgent, SupplierAgent } from "@enterpriseverse/types";

export interface Product {
  id: string;
  name: string;
  unitPrice: number;
  unitCost: number;
  inventory: number;
  quality: number;
}

export interface MarketSnapshot {
  day: number;
  demand: number;
  unitsSold: number;
  stockout: boolean;
  averagePrice: number;
  customerSatisfaction: number;
  supplierReliability: number;
}

export interface LivingWorldResult {
  business: Business;
  product: Product;
  market: MarketSnapshot;
  log: string[];
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

/** Resolves one market day from stateful customer/supplier behaviour. */
export function resolveMarketDay(
  business: Business,
  product: Product,
  customers: CustomerAgent[],
  suppliers: SupplierAgent[],
): LivingWorldResult {
  const demandMultiplier = 0.75 + clamp(business.reputation) / 200;
  const customerDemand = customers.reduce((total, customer) => {
    const affordability = clamp(100 - (product.unitPrice / Math.max(customer.budget, 1)) * 100);
    const preference = (customer.qualityPreference * product.quality + customer.trust * 100) / 200;
    return total + (affordability * customer.priceSensitivity + preference * (100 - customer.priceSensitivity)) / 100;
  }, 0);
  const demand = Math.max(0, Math.round(customerDemand * demandMultiplier / 4));
  const unitsSold = Math.min(product.inventory, demand);
  const stockout = unitsSold < demand;
  const supplierReliability = suppliers.length
    ? suppliers.reduce((sum, supplier) => sum + supplier.reliability, 0) / suppliers.length
    : 0;
  const satisfaction = clamp(Math.round(50 + business.reputation * 0.35 + (stockout ? -20 : 10) + supplierReliability * 0.15));
  const revenue = unitsSold * product.unitPrice;
  const cost = unitsSold * product.unitCost;
  const nextInventory = product.inventory - unitsSold;
  const nextBusiness: Business = {
    ...business,
    revenue: business.revenue + revenue,
    expenses: business.expenses + cost,
    cash: business.cash + revenue - cost,
    inventory: Math.max(0, business.inventory + nextInventory - product.inventory),
    reputation: clamp(business.reputation + (satisfaction >= 70 ? 1 : satisfaction < 45 ? -2 : 0)),
  };

  return {
    business: nextBusiness,
    product: { ...product, inventory: nextInventory },
    market: {
      day: business.day,
      demand,
      unitsSold,
      stockout,
      averagePrice: product.unitPrice,
      customerSatisfaction: satisfaction,
      supplierReliability,
    },
    log: [
      `Day ${business.day}: market demand was ${demand} units; ${unitsSold} sold at ₹${product.unitPrice}.`,
      stockout ? "Stockout: unmet demand damaged customer experience." : "Demand was fulfilled without a stockout.",
    ],
  };
}

export function restockProduct(product: Product, supplier: SupplierAgent, units: number): { product: Product; cashCost: number } {
  const quantity = Math.max(0, Math.min(Math.floor(units), supplier.capacity));
  const cashCost = quantity * supplier.unitCost;
  return {
    product: { ...product, inventory: product.inventory + quantity, unitCost: supplier.unitCost },
    cashCost,
  };
}
