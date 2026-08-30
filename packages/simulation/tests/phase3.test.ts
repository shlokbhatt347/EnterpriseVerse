import { describe, expect, it } from 'vitest';
import { advancePhase3World, createPhase3World, simulatePhase3, validatePhase3World } from '../src/phase3';

describe('Phase 3 causal business world', () => {
  it('is deterministic for the same seed and decisions', () => {
    let a=createPhase3World(42,'technology');
    let b=createPhase3World(42,'technology');
    const decision={price:115,marketing:500,qualityInvestment:10,hiring:2,training:200,borrowing:5000};
    for(let i=0;i<30;i++){a=advancePhase3World(a,decision);b=advancePhase3World(b,decision);}
    expect(a).toEqual(b);
  });
  it('diverges predictably under different strategies', () => {
    let premium=createPhase3World(7,'technology');
    let lowCost=createPhase3World(7,'retail');
    for(let i=0;i<60;i++){premium=advancePhase3World(premium,{price:135,qualityInvestment:15,marketing:300});lowCost=advancePhase3World(lowCost,{price:80,marketing:700});}
    expect(premium.finance.revenue).not.toBe(lowCost.finance.revenue);
    expect(premium.markets[0].demandIndex).not.toBe(lowCost.markets[0].demandIndex);
  });
  it('keeps economic state bounded for long runs', () => {
    const world=simulatePhase3(99,500,{price:105,marketing:200,hiring:1,training:100});
    expect(validatePhase3World(world)).toEqual([]);
    expect(world.day).toBe(500);
    expect(Number.isFinite(world.finance.valuation)).toBe(true);
  });
  it('handles adversarial financial inputs safely', () => {
    let world=createPhase3World(5);
    world=advancePhase3World(world,{price:-100000,borrowing:999999999,repayment:999999999,hiring:999999999,marketing:999999999});
    expect(validatePhase3World(world)).toEqual([]);
    expect(world.finance.cash).toBeGreaterThanOrEqual(0);
    expect(world.capital.debt).toBeGreaterThanOrEqual(0);
  });
  it('records causal explanations and event propagation', () => {
    let world=createPhase3World(1,'manufacturing');
    for(let i=0;i<100;i++)world=advancePhase3World(world,{price:120,marketing:100});
    expect(world.explanations.length).toBe(1);
    expect(world.explanations[0].effects.length).toBeGreaterThanOrEqual(4);
  });
});
