import type { SimulationState, OperationsState, FinancialSnapshot } from '@enterpriseverse/types';
import {
  advanceDeepPhase3World,
  createDeepPhase3World,
  type DeepWorld,
} from './phase3-advanced';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const finite = (value: number, fallback: number): number => Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, finite(value, min)));

function seedDeepWorld(state: SimulationState): DeepWorld {
  const industry = state.business.industry.toLowerCase();
  const supported = ['technology', 'retail', 'manufacturing', 'food', 'services', 'logistics'] as const;
  const selected = supported.find((item) => industry.includes(item)) ?? 'retail';
  const world = createDeepPhase3World(state.replay?.seed ?? state.meta?.seed ?? 1, selected);

  world.day = state.business.day;
  world.macro.day = state.business.day;
  world.finance.cash = Math.max(0, finite(state.business.cash, world.finance.cash));
  world.finance.revenue = Math.max(0, finite(state.business.revenue, 0));
  world.finance.costs = Math.max(0, finite(state.business.expenses, 0));
  world.finance.netCashFlow = world.finance.revenue - world.finance.costs;
  world.finance.debt = Math.max(0, finite(state.operations?.debt ?? world.finance.debt, world.finance.debt));
  world.capital.debt = world.finance.debt;
  world.reputation.trust = clamp(state.business.reputation, 0, 100);
  world.markets[0].averagePrice = Math.max(0.01, finite(state.operations?.price ?? world.markets[0].averagePrice, world.markets[0].averagePrice));
  world.markets[0].marketShare = clamp(state.business.marketShare / 100, 0, 1);
  world.inventory.finishedGoods = Math.max(0, finite(state.business.inventory, world.inventory.finishedGoods));
  world.production.capacity = Math.max(1, finite(state.operations?.productionCapacity ?? world.production.capacity, world.production.capacity));
  world.workforce.headcount = Math.max(1, Math.round(finite(state.operations?.employees ?? world.workforce.headcount, world.workforce.headcount)));
  world.workforce.productivity = clamp(world.workforce.productivity, 0, 100);
  world.information.customerSentiment = clamp(state.operations?.customerSatisfaction ?? world.information.customerSentiment, 0, 100);

  if (state.phase3?.world) {
    const persisted = clone(state.phase3.world) as Partial<DeepWorld>;
    return {
      ...world,
      ...persisted,
      deep: {
        ...world.deep,
        ...(persisted.deep ?? {}),
      },
    } as DeepWorld;
  }
  return world;
}

function decisionFromState(state: SimulationState): Parameters<typeof advanceDeepPhase3World>[1] {
  const operations = state.operations;
  return {
    price: Math.max(0.01, finite(operations?.price ?? 100, 100)),
    qualityInvestment: Math.max(0, finite((operations?.quality ?? 70) - 70, 0)),
    marketing: Math.max(0, finite(operations?.marketingBudget ?? 0, 0)),
    hiring: Math.round(finite((operations?.employees ?? 10) - (state.workforce?.employees.length ?? operations?.employees ?? 10), 0)),
    training: Math.max(0, finite(state.workforce?.trainingBudget ?? 0, 0)),
    capacityInvestment: 0,
    inventoryTarget: Math.max(0, finite(state.business.inventory, 0)),
    borrowing: Math.max(0, finite((operations?.debt ?? 0) - (state.financials?.debt ?? 0), 0)),
    repayment: Math.max(0, finite((state.financials?.debt ?? 0) - (operations?.debt ?? 0), 0)),
    productionTarget: Math.max(0, finite(operations?.productionCapacity ?? 0, 0)),
  };
}

function toFinancialSnapshot(world: DeepWorld, previous?: FinancialSnapshot): FinancialSnapshot {
  const cash = Math.max(0, world.finance.cash);
  const expenses = Math.max(0, world.finance.operatingCost + world.finance.capex + world.finance.interest);
  const grossProfit = world.finance.revenue - world.finance.operatingCost;
  const netProfit = grossProfit - world.finance.interest;
  const burnRate = netProfit < 0 ? Math.abs(netProfit) : 0;
  return {
    day: world.day,
    revenue: world.finance.revenue,
    expenses,
    grossProfit,
    netProfit,
    cash,
    debt: Math.max(0, world.finance.debt),
    inventoryValue: Math.max(0, world.inventory.finishedGoods * world.production.unitCost),
    workingCapital: cash + Math.max(0, world.inventory.finishedGoods * world.production.unitCost) - Math.max(0, world.finance.debt),
    burnRate,
    runwayDays: burnRate > 0 ? Math.floor(cash / burnRate) : (previous?.runwayDays ?? 9999),
    valuation: Math.max(0, world.finance.valuation),
  };
}

export function advanceAuthoritativePhase3(state: SimulationState): SimulationState {
  const current = seedDeepWorld(state);
  const next = advanceDeepPhase3World(current, decisionFromState(state));
  const firstProduct = state.economy?.products[0];
  const operations: OperationsState = {
    ...(state.operations ?? { price: 100, quality: 70, marketingBudget: 0, productionCapacity: next.production.capacity, employees: next.workforce.headcount, supplierUnitCost: next.production.unitCost, brandAwareness: 50, customerSatisfaction: 70, debt: 0 }),
    price: next.markets[0].averagePrice,
    quality: next.reputation.productQuality,
    productionCapacity: next.production.capacity,
    employees: next.workforce.headcount,
    supplierUnitCost: next.production.unitCost,
    customerSatisfaction: next.information.customerSentiment,
    debt: next.finance.debt,
    marketingBudget: 0,
  };
  const business = {
    ...state.business,
    day: next.day,
    cash: Math.max(0, next.finance.cash),
    revenue: Math.max(0, next.finance.revenue),
    expenses: Math.max(0, next.finance.costs),
    reputation: clamp(next.reputation.trust, 0, 100),
    inventory: Math.max(0, next.inventory.finishedGoods),
    marketShare: clamp(next.markets[0].marketShare * 100, 0, 100),
    status: next.lifecycle === 'failed' ? 'failed' as const : state.business.status,
  };
  const market = state.market ? {
    ...state.market,
    demandIndex: next.markets[0].demandIndex,
    marketPrice: next.markets[0].averagePrice,
    competitorPrice: next.competitors[0]?.price ?? state.market.competitorPrice,
    competitorQuality: next.competitors[0]?.quality ?? state.market.competitorQuality,
    competitorMarketShare: next.competitors.reduce((sum, c) => sum + c.marketShare, 0) * 100,
    trend: next.markets[0].trend,
    confidence: next.information.confidence * 100,
    priceElasticity: next.industries.find((i) => i.id === next.markets[0].industry)?.demandElasticity ?? state.market.priceElasticity,
    competitivePressure: next.markets[0].demandIndex < 100 ? Math.min(100, state.market.competitivePressure + 1) : state.market.competitivePressure,
  } : undefined;
  const economy = state.economy ? {
    ...state.economy,
    products: state.economy.products.map((product, index) => index === 0 ? {
      ...product,
      sellingPrice: next.markets[0].averagePrice,
      quality: next.reputation.productQuality,
      inventory: next.inventory.finishedGoods,
      productionCost: next.production.unitCost,
      demandScore: next.markets[0].demandIndex,
    } : product),
  } : state.economy;
  return {
    ...state,
    business,
    operations,
    market,
    economy,
    financials: toFinancialSnapshot(next, state.financials),
    phase3: { version: 1, seed: next.seed, world: clone(next) as unknown as Record<string, unknown> },
    events: next.events.map((event) => ({
      id: event.id,
      title: event.kind.replace(/_/g, ' '),
      message: `${event.kind} severity ${(event.severity * 100).toFixed(0)}% for ${event.duration} days.`,
      choices: [],
    })),
    log: [...state.log, `Day ${next.day}: Phase 3 world transition — demand ${next.markets[0].demandIndex.toFixed(1)}, output ${next.production.output.toFixed(1)}, cash ₹${next.finance.cash.toFixed(0)}.`, ...next.telemetry.slice(-1).map((t) => `Causal trace: ${t.causes.join(' → ')} → ${t.effects.join(', ')}.`)],
  };
}
