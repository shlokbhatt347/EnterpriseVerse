# EnterpriseVerse Experience Transformation — Phase 2

## Goal

Extend the canonical EnterpriseVerse experience established by Phase 1 without replacing the simulation engine or removing legacy surfaces prematurely.

## Implemented migration slices

### World / Executive Command Center

- Wrapped `/world` in the canonical `CanonicalShell`.
- Replaced direct `localStorage` state management with `useSimulation`.
- Routed decisions through the canonical `commitChoice` adapter.
- Routed day advancement through the canonical `endDay` adapter.
- Preserved the Phase 4 command-center model and information architecture.
- Added scoped EV 3.0 styling overrides.

### Intelligence

- Moved `/intelligence` into `CanonicalShell`.
- Replaced its independent active-business loading path with `useSimulation`.
- Advisor briefs and what-if analysis now read the canonical active `SimulationState`.
- Preserved deterministic advisor roles, priorities and scenario projections.

### Learning

- Placed `/learning` inside `CanonicalShell` when an active enterprise exists.
- Kept Phase 23 learning history on its dedicated learning persistence key.
- Added direct navigation between Enterprise, Intelligence and Learning.

### Endgame

- Moved `/endgame` onto `CanonicalShell`.
- Replaced direct `localStorage` reads with `useSimulation`.
- Legacy scoring, achievements, season and global ranking systems remain intact.

### Competition

- Wrapped `/competition` in `CanonicalShell` without changing its multiplayer persistence ownership.
- Retained server-authoritative rooms, players, friendships, leaderboard, realtime updates and decision submission APIs.
- Kept `competition-sim.ts` as the deterministic per-player competition simulation adapter.
- Mirrors the browser-cached competition simulation into the canonical shell so executive KPIs update after competition decisions.
- Does not force multiplayer state through the single-player `useSimulation` persistence adapter.

## Architectural rule

The canonical shell is shared across EnterpriseVerse surfaces, while simulation ownership remains domain-specific where multiplayer semantics require it. Surfaces must not create competing ownership for the same state.

## Remaining migration slices

1. Browser visual QA at desktop, tablet, and mobile breakpoints.
2. Verify Competition realtime and fallback synchronization with the canonical shell mounted.
3. Cross-surface decision/consequence navigation polish.
4. Legacy CSS/scaffold cleanup only after migrated surfaces pass QA.

## Deferred cleanup

Historical CSS and duplicate scaffolds remain until the migrated surfaces have passed functional and visual QA. No destructive cleanup is part of Phase 2.
