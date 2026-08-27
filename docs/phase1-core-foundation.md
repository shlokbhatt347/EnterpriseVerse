# Phase 1 — Core Simulation Foundation

This document records the Phase 1 contract for the simulation engine.

## State ownership

- `Business` is the public operational projection consumed by the existing UI.
- `EconomyState.accounting` is the canonical record of economic cash movements and profit calculation.
- Ledger purchase entries are cash outflows but not immediate P&L expenses.
- Ledger sale entries carry revenue and COGS; COGS affects gross profit but is not a second cash outflow.
- Opening capital is represented separately from earned revenue through `openingCash`.
- `SimulationState.meta` carries simulation version and deterministic seed metadata.
- `SimulationEngine` is the canonical public boundary for creating and stepping a simulation; each operation validates before its resulting state is committed.

## Day transition contract

A state transition is immutable at the public engine boundary: the previous engine instance remains unchanged, the next state is validated, and an invalid result is never committed to a new engine instance.

The existing domain modules remain behind this boundary so later phases can migrate individual systems without breaking current consumers.

## Invariants

The engine validates finite/non-negative money, non-negative inventory, bounded quality/reputation/market-share fields, unique ledger IDs, positive simulation days, and accounting cash reconciliation. Domain-specific invariants are additive rather than replacing existing validation.

## Determinism

Simulation randomness is seed-derived. Independent deterministic streams can be derived per subsystem and day so unrelated draws cannot shift another subsystem's sequence. The public engine propagates the selected seed into simulation metadata and replay metadata.

## Compatibility

Legacy exports (`createBusiness`, `advanceDay`, and `applyChoice`) remain available for existing application consumers. New code should use `createSimulation` from the public simulation package and treat `SimulationEngine` as the stable Phase 1 boundary.
