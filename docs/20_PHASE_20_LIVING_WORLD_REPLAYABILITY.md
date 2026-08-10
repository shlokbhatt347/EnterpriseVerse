# Phase 20 — Living World + Replayability Experience

Phase 20 turns the Phase 19 AI/living-market foundation into a coherent, replayable world model.

## Implemented

- Deterministic world events driven by seed, day and market conditions.
- Event categories: macro, market, supply, competitor, customer, reputation and opportunity.
- Event severity and duration, so important situations persist instead of disappearing immediately.
- Persistent business/world memories with sentiment and strength.
- Explicit cause → effect records with delayed observation days and confidence.
- Daily world snapshots containing market state, competitor actions, player outcomes, active events and world pressure.
- Stable replay signatures for deterministic verification.
- Replay comparison across two seeded runs.
- Run summary metrics for decisions, events, memories, pressure and final business performance.
- Bounded histories for production-safe long runs.
- Pure simulation implementation: no browser, network or wall-clock randomness.

## Design contract

The authoritative business state remains owned by the existing simulation engine. Phase 20 observes the state and produces world evolution, memories, events, causes and replay telemetry. It does not directly mutate the canonical business state.

This separation allows the web experience, multiplayer layer and future persistence layer to consume the same deterministic world model without creating a second simulation engine.

## Replayability contract

For a fixed seed, day sequence, player decision IDs and decision effects, the same world state and replay signatures must be reproducible. Different seeds are allowed to create materially different worlds while preserving valid bounds and deterministic behavior.

## Release gate

Phase 20 should not be merged until simulation tests, typecheck, web typecheck and production build are green.
