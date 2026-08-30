# Phase 3 — Deep Business World + Emergent Economy

## Contract

Phase 3 makes the business world causally interconnected. The canonical `business-world.ts` model links macroeconomics, industry structure, customer segments and memory, suppliers, production capacity, workforce economics, competitors, investors, financing, reputation, lifecycle, valuation and world events.

## Causal rules

- Price uses industry- and segment-specific elasticity.
- Customer demand combines price, quality, brand, availability, macro conditions and customer memory.
- Workforce capacity depends on hiring, skills, morale, workload and labor-market conditions.
- Supplier capacity constrains production; input prices respond to macro commodity conditions.
- Competitors observe the player's current position and adapt according to distinct archetypes.
- Financing changes debt and interest burden; leverage feeds back into investment risk and valuation.
- Customer experience changes satisfaction, churn, trust and future memory.
- Events propagate through affected subsystems instead of directly rewriting arbitrary business fields.
- Lifecycle stage is derived from operating fundamentals and can enter crisis or failure.

## Determinism

All stochastic behavior uses the injected deterministic RNG. A fixed seed plus fixed decision sequence produces the same world trajectory.

## Stability

`validateWorld` enforces finite values, non-negative cash/debt/inventory, bounded share/reputation and positive pricing. `runLong` performs invariant checks every day. `runMonteCarlo` provides repeatable calibration statistics for survival, valuation and profit.

## Explainability

Each step emits causal effects with source, target, magnitude and explanation. The returned report summarizes demand, sales, financial outcome, macro conditions, lifecycle and valuation.

## Phase 3 acceptance

- [x] World model
- [x] Macro engine
- [x] Industry parameters
- [x] Segment demand and elasticity
- [x] Customer memory
- [x] Supplier capacity and procurement
- [x] Production and capacity constraints
- [x] Workforce and hiring economics
- [x] Competitor archetypes and responses
- [x] Financing and investor response
- [x] Valuation and lifecycle
- [x] Event generation and propagation
- [x] Causal feedback effects
- [x] Deterministic RNG
- [x] Explainability
- [x] Long-run validation
- [x] Monte Carlo calibration harness
- [x] Regression tests
