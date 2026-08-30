# Phase 3 — Deep Business World + Emergent Economy

Phase 3 adds a deterministic, bounded and explainable economic world around the existing simulation. The engine is deliberately pure: it consumes a seeded world and player decisions and returns the next world state. It does not bypass Phase 2 authority or mutate persistence directly.

## World model

`Phase3World` contains macroeconomy, industries, markets, customer segments and memories, suppliers, workforce, competitors, capital, finance, reputation, events and causal explanations.

## Causal flow

Decision → macro conditions → demand → supply/capacity → revenue/costs/cash flow → reputation/workforce/competition → capital and valuation → next world state.

Events are generated from conditions and deterministic seeded hashes. Supplier disruptions propagate through available capacity rather than directly rewriting unrelated business fields.

## Determinism and safety

- Same seed + same initial state + same decisions produces the same world.
- No ambient `Math.random()` is used by the Phase 3 engine.
- Numeric state is bounded and finite.
- Debt, cash, headcount, market share and macro variables are constrained.
- Extreme player inputs are clamped.
- `validatePhase3World` is intended for every integration boundary.
- The adapter reads existing `SimulationState`; authoritative multiplayer persistence remains outside this engine.

## Validation

The Phase 3 test suite covers deterministic replay, strategy divergence, 500-day stability, adversarial inputs, causal explanations and event generation. Long-run and property-style tests should remain part of the repository quality gate as the model expands.
