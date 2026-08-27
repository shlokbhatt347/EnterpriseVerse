import type { AccountingState, EconomyState, MarketState, SimulationState } from "@enterpriseverse/types";
import { reconcileCash } from "./economy/accounting";

export interface InvariantFailure {
  code: string;
  message: string;
}

const finite = (value: number): boolean => Number.isFinite(value);
const inRange = (value: number, min: number, max: number): boolean => finite(value) && value >= min && value <= max;

export function validateAccountingState(accounting: AccountingState): InvariantFailure[] {
  const failures: InvariantFailure[] = [];
  if (!finite(accounting.cashIn) || accounting.cashIn < 0) failures.push({ code: "accounting.cashIn", message: "Cash inflows must be finite and non-negative." });
  if (!finite(accounting.cashOut) || accounting.cashOut < 0) failures.push({ code: "accounting.cashOut", message: "Cash outflows must be finite and non-negative." });
  if (!finite(accounting.grossProfit)) failures.push({ code: "accounting.grossProfit", message: "Gross profit must be finite." });
  if (!finite(accounting.netProfit)) failures.push({ code: "accounting.netProfit", message: "Net profit must be finite." });
  if (!finite(accounting.inventoryValue) || accounting.inventoryValue < 0) failures.push({ code: "accounting.inventoryValue", message: "Inventory value must be finite and non-negative." });
  if (accounting.openingCash !== undefined && (!finite(accounting.openingCash) || accounting.openingCash < 0)) failures.push({ code: "accounting.openingCash", message: "Opening cash must be finite and non-negative." });
  const expectedCash = reconcileCash(accounting);
  if (accounting.cashBalance !== undefined && Math.abs(accounting.cashBalance - expectedCash) > 0.005) failures.push({ code: "accounting.cash-reconciliation", message: "Accounting cash balance does not reconcile with opening cash and cash flows." });
  const ids = new Set<string>();
  for (const entry of accounting.ledger) {
    if (ids.has(entry.id)) failures.push({ code: `accounting.duplicate-ledger-${entry.id}`, message: "Ledger entry IDs must be unique." });
    ids.add(entry.id);
    if (!finite(entry.debit) || entry.debit < 0) failures.push({ code: `accounting.debit-${entry.id}`, message: "Ledger debits must be finite and non-negative." });
    if (!finite(entry.credit) || entry.credit < 0) failures.push({ code: `accounting.credit-${entry.id}`, message: "Ledger credits must be finite and non-negative." });
    if (!Number.isInteger(entry.day) || entry.day < 1) failures.push({ code: `accounting.day-${entry.id}`, message: "Ledger entries must belong to a positive integer day." });
  }
  return failures;
}

export function validateEconomyState(economy: EconomyState): InvariantFailure[] {
  const failures: InvariantFailure[] = [...validateAccountingState(economy.accounting)];
  const productIds = new Set<string>();
  for (const product of economy.products) {
    if (productIds.has(product.id)) failures.push({ code: `economy.duplicate-product-${product.id}`, message: "Product IDs must be unique." });
    productIds.add(product.id);
    if (!finite(product.inventory) || product.inventory < 0) failures.push({ code: `economy.inventory-${product.id}`, message: "Product inventory cannot be negative or non-finite." });
    if (!finite(product.sellingPrice) || product.sellingPrice < 0) failures.push({ code: `economy.price-${product.id}`, message: "Selling price must be finite and non-negative." });
    if (!finite(product.productionCost) || product.productionCost < 0) failures.push({ code: `economy.cost-${product.id}`, message: "Production cost must be finite and non-negative." });
    if (!inRange(product.quality, 0, 100)) failures.push({ code: `economy.quality-${product.id}`, message: "Product quality must stay within 0..100." });
    if (!inRange(product.demandScore, 0, 100)) failures.push({ code: `economy.demand-${product.id}`, message: "Product demand score must stay within 0..100." });
  }
  return failures;
}

export function validateMarketState(market: MarketState): InvariantFailure[] {
  const failures: InvariantFailure[] = [];
  if (!finite(market.demandIndex) || market.demandIndex < 0) failures.push({ code: "market.demand", message: "Demand index must be finite and non-negative." });
  if (!finite(market.marketPrice) || market.marketPrice < 0) failures.push({ code: "market.price", message: "Market price must be finite and non-negative." });
  if (!inRange(market.competitorMarketShare, 0, 100)) failures.push({ code: "market.competitor-share", message: "Competitor market share must stay within 0..100." });
  if (!inRange(market.confidence, 0, 100)) failures.push({ code: "market.confidence", message: "Market confidence must stay within 0..100." });
  if (!inRange(market.customerAcquisition, 0, 100)) failures.push({ code: "market.acquisition", message: "Customer acquisition must stay within 0..100." });
  if (!inRange(market.competitivePressure, 0, 100)) failures.push({ code: "market.pressure", message: "Competitive pressure must stay within 0..100." });
  if (!inRange(market.strategyScore, 0, 100)) failures.push({ code: "market.strategy", message: "Strategy score must stay within 0..100." });
  return failures;
}

export function validateSimulationStateV1(state: SimulationState): InvariantFailure[] {
  const failures: InvariantFailure[] = [];
  const b = state.business;
  if (!Number.isInteger(b.day) || b.day < 1) failures.push({ code: "business.day", message: "Simulation day must be a positive integer." });
  if (!finite(b.cash) || b.cash < 0) failures.push({ code: "business.cash", message: "Business cash must be finite and non-negative." });
  if (!finite(b.revenue) || b.revenue < 0) failures.push({ code: "business.revenue", message: "Business revenue must be finite and non-negative." });
  if (!finite(b.expenses) || b.expenses < 0) failures.push({ code: "business.expenses", message: "Business expenses must be finite and non-negative." });
  if (!finite(b.inventory) || b.inventory < 0) failures.push({ code: "business.inventory", message: "Business inventory must be finite and non-negative." });
  if (!inRange(b.reputation, 0, 100)) failures.push({ code: "business.reputation", message: "Business reputation must stay within 0..100." });
  if (!inRange(b.marketShare, 0, 100)) failures.push({ code: "business.marketShare", message: "Business market share must stay within 0..100." });
  if (state.economy) failures.push(...validateEconomyState(state.economy));
  if (state.market) failures.push(...validateMarketState(state.market));
  if (state.meta && state.meta.version !== 1) failures.push({ code: "meta.version", message: "Unsupported simulation state version." });
  return failures;
}

export function assertSimulationStateV1(state: SimulationState): void {
  const failures = validateSimulationStateV1(state);
  if (failures.length) throw new Error(`Simulation invariant violation: ${failures.map((failure) => `${failure.code}: ${failure.message}`).join(" | ")}`);
}
