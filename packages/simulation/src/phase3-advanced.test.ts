import { describe, expect, it } from 'vitest';
import { advanceDeepPhase3World, createDeepPhase3World, counterfactualDeepPhase3, deepStrategyDiversity, marketIntelligence, runDeepAdversarialSuite, runDeepMonteCarlo, setDeepStrategy, validateDeepPhase3World } from './phase3-advanced';

describe('Phase 3 advanced ecosystem', () => {
  it('preserves causal agent memory across transitions', () => {
    const a = createDeepPhase3World(31);
    const b = advanceDeepPhase3World(a, { price: 90, marketing: 30 });
    expect(b.deep.customers).toHaveLength(a.deep.customers.length);
    expect(b.deep.suppliers).toHaveLength(a.deep.suppliers.length);
    expect(b.deep.competitors).toHaveLength(a.deep.competitors.length);
    expect(b.deep.traces.length).toBeGreaterThan(a.deep.traces.length);
  });

  it('supports strategic plans and information asymmetry', () => {
    const a = createDeepPhase3World(32);
    const b = setDeepStrategy(a, { strategy: 'growth', horizon: 'month', cashBuffer: 9000 });
    expect(b.deep.plan.strategy).toBe('growth');
    expect(b.deep.plan.cashBuffer).toBe(9000);
    const report = marketIntelligence(b);
    expect(report.economic.interestRate).toBe(b.macro.interestRate);
    expect(report.competitorPrices.length).toBeGreaterThan(1);
  });

  it('keeps a counterfactual separate from the source world', () => {
    const a = createDeepPhase3World(33);
    const before = JSON.stringify(a);
    const b = counterfactualDeepPhase3(a, { price: 130, marketing: 40 }, 20);
    expect(JSON.stringify(a)).toBe(before);
    expect(b.day).toBe(a.day + 20);
  });

  it('supports long-run Monte Carlo without invalid outcomes', () => {
    const report = runDeepMonteCarlo(10, 120);
    expect(report.runs).toBe(10);
    expect(report.survivalRate).toBeGreaterThanOrEqual(0);
    expect(report.survivalRate).toBeLessThanOrEqual(1);
    expect(Number.isFinite(report.averageValuation)).toBe(true);
    expect(report.minCash).toBeGreaterThanOrEqual(0);
  });

  it('passes adversarial economic inputs', () => {
    const report = runDeepAdversarialSuite(34);
    expect(report.passed).toBe(true);
    expect(report.failures).toEqual([]);
  });

  it('produces differentiated strategic outcomes', () => {
    const results = deepStrategyDiversity(35, 90);
    expect(results).toHaveLength(6);
    expect(new Set(results.map(x => Math.round(x.valuation))).size).toBeGreaterThan(1);
  });

  it('keeps the deep world valid after a prolonged mixed strategy run', () => {
    let w = createDeepPhase3World(36);
    for (let i = 0; i < 300; i++) {
      w = advanceDeepPhase3World(w, i % 3 === 0 ? { price: 85 + (i % 20), marketing: 8, training: 2 } : { productionTarget: 50 + (i % 30) });
      expect(validateDeepPhase3World(w).errors).toEqual([]);
    }
  });
});
