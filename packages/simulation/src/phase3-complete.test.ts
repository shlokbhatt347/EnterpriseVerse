import { describe, expect, it } from 'vitest';
import { advancePhase3World, calibratePhase3, comparePhase3Strategies, createPhase3World, deterministicReplay, restorePhase3Snapshot, runPhase3Days, validatePhase3World } from './phase3';

describe('Phase 3 deep business world', () => {
  it('creates a complete bounded world model', () => {
    const w = createPhase3World(42, 'manufacturing');
    expect(w.industries).toHaveLength(6);
    expect(w.segments).toHaveLength(4);
    expect(w.suppliers.length).toBeGreaterThan(1);
    expect(w.competitors.length).toBeGreaterThan(1);
    expect(w.inventory.warehouseCapacity).toBeGreaterThan(0);
    expect(w.production.capacity).toBeGreaterThan(0);
    expect(validatePhase3World(w)).toEqual([]);
  });

  it('is deterministic for identical seed and decisions', () => {
    const decisions = Array.from({ length: 100 }, (_, i) => ({ price: 90 + (i % 7), marketing: i % 3 === 0 ? 10 : 0 }));
    expect(deterministicReplay(123, 100, decisions)).toBe(true);
  });

  it('keeps extreme inputs bounded and finite', () => {
    let w = createPhase3World(7);
    for (let i = 0; i < 200; i++) {
      w = advancePhase3World(w, { price: 1e99, borrowing: 1e99, repayment: 1e99, hiring: 1e99, layoffs: 1e99, marketing: 1e99, training: 1e99, capacityInvestment: 1e99, productionTarget: 1e99 });
      expect(validatePhase3World(w)).toEqual([]);
      expect(Number.isFinite(w.finance.cash)).toBe(true);
      expect(Number.isFinite(w.finance.valuation)).toBe(true);
    }
  });

  it('preserves snapshot/replay semantics', () => {
    const initial = createPhase3World(9);
    const later = runPhase3Days(initial, 30)[30];
    expect(restorePhase3Snapshot(later)).toEqual(later);
  });

  it('produces explainable outcomes and telemetry', () => {
    const w = advancePhase3World(createPhase3World(11), { price: 80, marketing: 25, qualityInvestment: 20, hiring: 2 });
    expect(w.explanations.length).toBeGreaterThan(0);
    expect(w.explanations[0].effects.length).toBeGreaterThan(0);
    expect(w.telemetry.length).toBeGreaterThan(0);
    expect(w.telemetry[0].seed).toBe(11);
  });

  it('supports strategic diversity analysis', () => {
    const results = comparePhase3Strategies(21, 120);
    expect(results.length).toBeGreaterThanOrEqual(6);
    expect(new Set(results.map(r => Math.round(r.valuation))).size).toBeGreaterThan(1);
  });

  it('supports repeated calibration runs', () => {
    const report = calibratePhase3(12, 60);
    expect(report.runs).toBe(12);
    expect(report.survivalRate).toBeGreaterThanOrEqual(0);
    expect(report.survivalRate).toBeLessThanOrEqual(1);
    expect(report.averageValuation).toBeGreaterThan(0);
    expect(report.averageDebt).toBeGreaterThanOrEqual(0);
    expect(report.inflationRange[0]).toBeLessThanOrEqual(report.inflationRange[1]);
  });

  it('survives long deterministic runs', () => {
    let w = createPhase3World(99);
    for (let i = 0; i < 500; i++) {
      w = advancePhase3World(w, i % 5 === 0 ? { price: 95 + (i % 11), marketing: 5 } : {});
      expect(validatePhase3World(w)).toEqual([]);
    }
    expect(w.day).toBe(501);
  });
});
