# Phase 16 — Replayable Business Engine

Phase 16 turns the existing EnterpriseVerse simulation into a deterministic, replayable world while preserving the existing `SimulationState` engine and the Phase 15 player/account boundary.

## Delivered

- Deterministic world generation from a numeric or string seed.
- Five difficulty levels: Beginner, Standard, Advanced, Expert and Founder.
- Eight business archetypes: Tech Startup, Retail, Food, Manufacturing, E-commerce, SaaS, Services and Sustainable Business.
- Founder trait model covering innovation, negotiation, finance, marketing, operations, leadership and risk.
- Archetype-specific starting economics, demand, quality, reputation and inventory.
- World-level market growth, inflation, customer price sensitivity, supplier reliability, competitor strength and event volatility.
- Seeded dynamic decision events covering demand, supply, competition and resilience.
- Trait-aware decision effects so founder strengths influence outcomes without making decisions deterministic.
- Replayable run envelope that stores seed, difficulty, world, founder profile, simulation state and decision history.
- Counterfactual evaluation for testing an alternative decision without mutating the live run.
- Multi-dimensional run assessment covering finance, customers, operations, strategy, resilience and learning.
- Founder-style classification based on observed strengths.
- Strict save-data validation with versioned Phase 16 save payloads.
- Unit tests for determinism, replay persistence, bounded outcomes, counterfactuals and assessment.

## Determinism contract

The same seed + difficulty + archetype produces the same generated world. Randomness is isolated to a small deterministic PRNG and never uses `Math.random()`.

This makes bug reports reproducible and allows future multiplayer/leaderboard systems to verify a run from its seed and recorded actions.

## Compatibility contract

Phase 16 does not replace the existing simulation functions. Existing `createBusiness`, `advanceDay` and `applyChoice` remain the canonical Prototype 1 engine. Phase 16 wraps those functions and adds the replayable world layer around them.

Phase 15 authentication and persistence remain independent. A `Phase16Run` is plain serializable data and can therefore be stored by the existing local/cloud save boundary.

## Release gate

Phase 16 is structurally complete only when:

- `pnpm test:simulation` is green;
- `pnpm typecheck:simulation` is green;
- deterministic-world tests pass;
- save → restore produces equivalent run data;
- alternative simulations do not mutate the active run;
- business cash/reputation remain bounded by the existing simulation invariants;
- the web production build remains green;
- no existing Prototype 1 user journey regresses.

## Next layer

Phase 17 can safely build player-vs-player competition, friends, verified run records and leaderboards because Phase 16 now supplies a deterministic world seed, decision history and a stable replay envelope.
