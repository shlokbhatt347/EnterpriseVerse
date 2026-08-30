import { advancePhase3World, createPhase3World, type Phase3Decision, type Phase3World, validatePhase3World } from './phase3';

export interface Phase3InvariantReport { errors: string[]; warnings: string[] }

export function checkPhase3Invariants(world: Phase3World): Phase3InvariantReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const bounded = [
    ['inflation', world.macro.inflation, 0, 20],
    ['interestRate', world.macro.interestRate, 0, 18],
    ['unemployment', world.macro.unemployment, 2, 20],
    ['consumerConfidence', world.macro.consumerConfidence, 10, 95],
    ['businessConfidence', world.macro.businessConfidence, 10, 95],
    ['creditAvailability', world.macro.creditAvailability, 10, 95],
    ['commodityIndex', world.macro.commodityIndex, 70, 160],
    ['workforce.morale', world.workforce.morale, 0, 100],
    ['workforce.retention', world.workforce.retention, 0, 100],
    ['production.utilization', world.production.utilization, 0, 1],
    ['reputation.trust', world.reputation.trust, 0, 100],
    ['reputation.productQuality', world.reputation.productQuality, 0, 100],
    ['reputation.service', world.reputation.service, 0, 100],
    ['reputation.reliability', world.reputation.reliability, 0, 100],
    ['capital.creditScore', world.capital.creditScore, 10, 95],
  ] as const;
  for (const [name, value, min, max] of bounded) {
    if (!Number.isFinite(value)) errors.push(`${name} is non-finite`);
    else if (value < min || value > max) errors.push(`${name} outside [${min}, ${max}]`);
  }
  if (world.inventory.finishedGoods > world.inventory.warehouseCapacity + 1e-9) errors.push('finished goods exceed warehouse capacity');
  if (world.production.output > world.production.capacity + 1e-9) errors.push('production exceeds capacity');
  if (world.suppliers.some(s => s.availableCapacity < -1e-9 || s.availableCapacity > s.capacity + 1e-9)) errors.push('supplier capacity invariant violated');
  if (world.finance.cash < -1e-9) errors.push('cash below zero');
  if (world.capital.debt < -1e-9 || world.finance.debt < -1e-9) errors.push('debt below zero');
  const share = world.markets.reduce((sum, market) => sum + market.marketShare, 0);
  if (share > 1 + 1e-9) warnings.push('aggregate tracked market share exceeds one; verify market partitioning');
  if (world.customers.filter(c => c.stage === 'churned').length === world.customers.length) warnings.push('all modeled customers churned');
  return { errors, warnings };
}

export function runPhase3LongHorizon(seed = 1, days = 5000, decision: Phase3Decision = {}): Phase3World {
  let world = createPhase3World(seed);
  for (let day = 0; day < days - 1; day++) {
    world = advancePhase3World(world, decision);
    const validation = validatePhase3World(world);
    if (validation.length) throw new Error(`Phase 3 invalid on day ${world.day}: ${validation.join('; ')}`);
    const invariants = checkPhase3Invariants(world);
    if (invariants.errors.length) throw new Error(`Phase 3 invariant failure on day ${world.day}: ${invariants.errors.join('; ')}`);
  }
  return world;
}

export interface Phase3AdversarialCase { name: string; decision: Phase3Decision }
export interface Phase3AdversarialReport { passed: boolean; cases: number; failures: string[] }

export function phase3AdversarialCases(): Phase3AdversarialCase[] {
  return [
    { name: 'maximum price', decision: { price: Number.MAX_VALUE } },
    { name: 'minimum price', decision: { price: -Number.MAX_VALUE } },
    { name: 'maximum borrowing', decision: { borrowing: Number.MAX_VALUE } },
    { name: 'maximum repayment', decision: { repayment: Number.MAX_VALUE } },
    { name: 'mass hiring', decision: { hiring: Number.MAX_VALUE } },
    { name: 'mass layoffs', decision: { layoffs: Number.MAX_VALUE } },
    { name: 'maximum marketing', decision: { marketing: Number.MAX_VALUE } },
    { name: 'maximum capacity investment', decision: { capacityInvestment: Number.MAX_VALUE } },
    { name: 'maximum production target', decision: { productionTarget: Number.MAX_VALUE } },
    { name: 'negative training', decision: { training: -Number.MAX_VALUE } },
    { name: 'combined extremes', decision: { price: -Number.MAX_VALUE, borrowing: Number.MAX_VALUE, repayment: Number.MAX_VALUE, hiring: Number.MAX_VALUE, layoffs: Number.MAX_VALUE, marketing: Number.MAX_VALUE, training: Number.MAX_VALUE, capacityInvestment: Number.MAX_VALUE, productionTarget: Number.MAX_VALUE } },
  ];
}

export function runPhase3Adversarial(seed = 77, days = 30): Phase3AdversarialReport {
  const failures: string[] = [];
  for (const testCase of phase3AdversarialCases()) {
    try {
      let world = createPhase3World(seed);
      for (let day = 0; day < days; day++) {
        world = advancePhase3World(world, testCase.decision);
        const invariants = checkPhase3Invariants(world);
        if (invariants.errors.length) throw new Error(invariants.errors.join('; '));
      }
    } catch (error) {
      failures.push(`${testCase.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { passed: failures.length === 0, cases: phase3AdversarialCases().length, failures };
}

export interface Phase3ScaleReport { businesses: number; days: number; elapsedMs: number; valid: boolean }

export function benchmarkPhase3Scale(businesses = 100, days = 30): Phase3ScaleReport {
  const started = Date.now();
  let valid = true;
  for (let business = 1; business <= businesses; business++) {
    let world = createPhase3World(business);
    for (let day = 0; day < days; day++) {
      world = advancePhase3World(world, day % 3 === 0 ? { price: 95 + business % 15, marketing: 10 } : {});
      if (checkPhase3Invariants(world).errors.length) valid = false;
    }
  }
  return { businesses, days, elapsedMs: Date.now() - started, valid };
}

export function deterministicWorldDigest(world: Phase3World): string {
  return JSON.stringify(world);
}
