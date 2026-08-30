import { describe, expect, it } from 'vitest';
import { benchmarkPhase3Scale, checkPhase3Invariants, deterministicWorldDigest, phase3AdversarialCases, runPhase3Adversarial, runPhase3LongHorizon } from './phase3-validation';
import { createPhase3World } from './phase3';

describe('Phase 3 completion validation', () => {
  it('keeps a 5000-day world valid', () => {
    const world = runPhase3LongHorizon(101, 5000, { price: 100, marketing: 5 });
    expect(world.day).toBe(5000);
    expect(checkPhase3Invariants(world).errors).toEqual([]);
  });

  it('passes the complete adversarial decision matrix', () => {
    const report = runPhase3Adversarial(102, 30);
    expect(report.cases).toBe(phase3AdversarialCases().length);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('provides a deterministic world digest', () => {
    const a = createPhase3World(103);
    const b = createPhase3World(103);
    expect(deterministicWorldDigest(a)).toBe(deterministicWorldDigest(b));
  });

  it('can execute a measured multi-business benchmark', () => {
    const report = benchmarkPhase3Scale(10, 10);
    expect(report.businesses).toBe(10);
    expect(report.days).toBe(10);
    expect(report.valid).toBe(true);
    expect(report.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
