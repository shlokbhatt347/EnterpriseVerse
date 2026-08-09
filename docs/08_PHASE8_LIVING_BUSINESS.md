# Phase 8 — Living Business Simulation

Phase 8 turns EnterpriseVerse from a collection of simulation subsystems into a connected, replayable business world.

## Systems

- **Lifecycle:** launch, survival, growth, expansion, maturity, crisis and exit stages.
- **Workforce:** hiring, training, morale, skill, productivity, workload, payroll and turnover risk.
- **Finance:** cash flow, profit, working capital, runway, debt-aware health and valuation snapshots.
- **Consequences:** delayed effects can resolve several days after the decision that created them.
- **Scenarios:** deterministic seeded macro, market, supply and demand events with durations and history.
- **Replay:** bounded daily snapshots, decision history and snapshot comparison for reproducible runs.
- **Assessment:** decision outcome scoring and end-of-run entrepreneurial profile, strengths, blind spots and recommendations.

## Daily simulation pipeline

1. Advance market conditions.
2. Advance deterministic scenarios.
3. Resolve due delayed consequences.
4. Run the economy and supply chain.
5. Advance workforce conditions.
6. Update business financials.
7. Run customer, supplier, competitor and investor agents.
8. Record replay state and decision outcomes.
9. Generate the next decision event.

## Determinism and safety

Scenario generation uses a numeric seed and day-derived pseudo-random values, so the same seed and state produce the same scenario result. Replay snapshots are bounded to prevent unbounded memory growth. Numeric health metrics are clamped where appropriate.

## Public simulation API

The simulation package exports lifecycle, workforce, finance, consequence, scenario, replay and assessment helpers in addition to the existing economy, market, operations, agent and learning APIs.

## Quality gate

Phase 8 adds focused integration coverage in `packages/simulation/src/phase8.test.ts`. The repository CI continues to run simulation tests, strict simulation typechecking, the web production build, API syntax validation and required-file checks.
