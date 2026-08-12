import type { SimulationState } from "@enterpriseverse/types";
import { calculateKpis, defaultOperations } from "./operations";
import { createMarketState } from "./market";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value * 10) / 10;

export interface IntegratedMetrics {
  unitMargin: number;
  demandCapture: number;
  customerRetention: number;
  supplierReliability: number;
  competitivePosition: number;
  operationalEfficiency: number;
  cashSafety: number;
  businessHealth: number;
}

const metricsCache = new WeakMap<object, IntegratedMetrics>();

export function calculateIntegratedMetrics(state: SimulationState): IntegratedMetrics {
  const cached = metricsCache.get(state as object);
  if (cached) return cached;

  const operations = state.operations ?? defaultOperations();
  const market = state.market ?? createMarketState();
  const economy = state.economy;
  const kpis = calculateKpis(state);

  const unitMargin = round(clamp(
    operations.price <= 0 ? 0 : ((operations.price - Math.max(0, operations.supplierUnitCost)) / operations.price) * 100,
  ));

  const demandCapture = round(clamp(
    50 + (market.demandIndex - 100) * 0.35 + (operations.brandAwareness - 50) * 0.25
      + (operations.customerSatisfaction - 50) * 0.3 - market.competitivePressure * 0.2,
  ));

  const customers = state.business.customers;
  const customerRetention = round(clamp(customers.length === 0 ? 0 : customers.reduce((sum, customer) => sum + customer.trust, 0) / customers.length));

  const suppliers = state.business.suppliers;
  const supplierReliability = round(clamp(suppliers.length === 0 ? 0 : suppliers.reduce((sum, supplier) => sum + supplier.reliability, 0) / suppliers.length));

  const competitivePosition = round(clamp(
    50 + (operations.quality - market.competitorQuality) * 0.8
      + (market.competitorPrice - operations.price) * 0.25
      + (state.business.marketShare - market.competitorMarketShare) * 0.4,
  ));

  const productionCapacity = Math.max(1, operations.productionCapacity);
  const inventory = economy?.products.reduce((sum, product) => sum + product.inventory, 0) ?? state.business.inventory;
  const operationalEfficiency = round(clamp(50 + Math.min(30, inventory / productionCapacity * 5) + Math.min(20, operations.employees * 2)));

  const dailyCost = Math.max(1, 450 + operations.employees * 150);
  const cashSafety = round(clamp((state.business.cash / dailyCost) * 3.33));

  const businessHealth = round(clamp(
    unitMargin * 0.15
      + demandCapture * 0.15
      + customerRetention * 0.15
      + supplierReliability * 0.1
      + competitivePosition * 0.15
      + operationalEfficiency * 0.1
      + cashSafety * 0.1
      + kpis.customerSatisfaction * 0.1,
  ));

  const result = {
    unitMargin,
    demandCapture,
    customerRetention,
    supplierReliability,
    competitivePosition,
    operationalEfficiency,
    cashSafety,
    businessHealth,
  };

  metricsCache.set(state as object, result);
  return result;
}

export function validateIntegratedState(state: SimulationState): string[] {
  const issues: string[] = [];
  const business = state.business;
  const operations = state.operations;
  const market = state.market;

  const finiteValues: Array<[string, number]> = [
    ["cash", business.cash],
    ["revenue", business.revenue],
    ["expenses", business.expenses],
    ["reputation", business.reputation],
    ["marketShare", business.marketShare],
  ];
  for (const [name, value] of finiteValues) if (!Number.isFinite(value)) issues.push(`business.${name} must be finite`);

  if (business.cash < 0) issues.push("business.cash cannot be negative");
  if (business.inventory < 0) issues.push("business.inventory cannot be negative");
  if (business.reputation < 0 || business.reputation > 100) issues.push("business.reputation must stay between 0 and 100");
  if (business.marketShare < 0 || business.marketShare > 100) issues.push("business.marketShare must stay between 0 and 100");

  if (operations) {
    if (!Number.isFinite(operations.price) || operations.price < 0) issues.push("operations.price must be finite and non-negative");
    if (!Number.isFinite(operations.productionCapacity) || operations.productionCapacity < 0) issues.push("operations.productionCapacity must be finite and non-negative");
    if (operations.debt < 0) issues.push("operations.debt cannot be negative");
  }

  if (market) {
    if (market.demandIndex < 0) issues.push("market.demandIndex cannot be negative");
    if (market.competitivePressure < 0 || market.competitivePressure > 100) issues.push("market.competitivePressure must stay between 0 and 100");
  }

  for (const product of state.economy?.products ?? []) {
    if (product.inventory < 0) issues.push(`product.${product.id}.inventory cannot be negative`);
    if (product.sellingPrice < 0 || product.productionCost < 0) issues.push(`product.${product.id} costs cannot be negative`);
  }

  return issues;
}
