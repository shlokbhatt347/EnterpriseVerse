# Phase 1 Progress

- Canonical accounting cash-flow semantics introduced.
- COGS no longer counted as a second cash outflow.
- Opening capital is represented separately from earned revenue.
- Economy snapshots preserve opening cash.
- State invariants cover financial, inventory, market, ledger and simulation metadata constraints.
- Deterministic per-subsystem random streams are available.
- Added `SimulationEngine` as the stable public state-transition boundary.
- Engine operations validate input/output state and preserve immutable previous engine instances.
- Simulation and replay metadata now propagate the selected deterministic seed through the engine boundary.
- Added engine determinism/immutability tests and hard invariant regression tests.
- Full repository Quality Gate and Production Gate are green for the current Phase 1 head.

## Completion gate

Phase 1 is considered complete for this branch when the canonical accounting contract, invariant suite, deterministic engine boundary, compatibility exports, and repository CI/production validation all remain green. Deeper migration of individual legacy domain modules can now proceed incrementally in later phases without changing the public engine boundary.
