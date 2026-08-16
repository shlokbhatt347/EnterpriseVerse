# Build 3 — Architecture Cleanup

Build 3 makes the canonical experience architecture enforceable without changing the domain behavior of the simulator.

## Canonical boundaries

- `packages/simulation` remains the simulation source of truth.
- `apps/web/app/lib/simulation/useSimulation` remains the shared active-enterprise adapter for transformed surfaces.
- `CanonicalShell` remains the shared experience/navigation shell.
- Learning may retain its domain-specific learning-history persistence because that history is not the active simulation state.
- Competition retains its server-authoritative room, round, realtime, and multiplayer decision boundaries.

## Cleanup completed

- Removed the obsolete Phase 24 one-time repair workflow.
- Removed duplicate Competition shell session-state persistence; the shell now uses a deterministic local projection while multiplayer truth stays server-authoritative.
- Added an architecture QA contract that prevents direct browser simulation persistence from returning to canonical surfaces.
- Added the architecture contract to the Quality Gate.

## Intentionally retained

Competition's multiplayer browser adapter, realtime channel, server-backed room state, and competition-specific simulation are not legacy code. They are an explicit bounded context and must not be collapsed into the single-player simulation adapter.

## Exit condition

A migrated surface must use the canonical shell and simulation adapter, and must not introduce its own browser persistence for active enterprise state.
