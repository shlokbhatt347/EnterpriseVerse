# Phase 1 — Core Simulation Foundation

This document records the Phase 1 contract for the simulation engine.

## State ownership

- `Business` is the public operational projection consumed by the existing UI.
- `EconomyState.accounting` is the canonical record of economic cash movements and profit calculation.
- Ledger purchase entries are cash outflows but not immediate P&L expenses.
- Ledger sale entries carry revenue and COGS; COGS affects gross profit but is not a second cash outflow.
- Opening capital is represented separately from earned revenue through `openingCash`.

## Invariants

The engine validates finite/non-negative money, non-negative inventory, bounded quality/reputation/market-share fields, unique ledger IDs, positive simulation days, and accounting cash reconciliation.

## Determinism

Simulation randomness is seed-derived. Independent random streams can be derived per subsystem and day so unrelated draws cannot shift another subsystem's sequence.
