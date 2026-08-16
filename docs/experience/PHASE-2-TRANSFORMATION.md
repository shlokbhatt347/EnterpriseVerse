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

## Architectural rule

The UI should consume the same `SimulationState` and persistence adapter as Day 1. Individual surfaces may retain domain-specific view models, but they must not create competing save paths or mutate simulation state independently.

## Remaining migration slices

1. Competition → canonical shell + reconcile multiplayer simulation state with the shared experience model.
2. Browser visual QA at desktop, tablet, and mobile breakpoints.
3. Cross-surface decision/consequence navigation polish.
4. Legacy CSS/scaffold cleanup only after migrated surfaces pass QA.

## Deferred cleanup

Historical CSS and duplicate scaffolds remain until the migrated surfaces have passed functional and visual QA. No destructive cleanup is part of Phase 2.
