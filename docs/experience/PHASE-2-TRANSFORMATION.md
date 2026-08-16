# EnterpriseVerse Experience Transformation — Phase 2

## Goal

Extend the canonical EnterpriseVerse experience established by Phase 1 without replacing the simulation engine or removing legacy surfaces prematurely.

## First migration slice

### World / Executive Command Center

- Wrapped the World surface in the canonical `CanonicalShell`.
- Replaced direct `localStorage` state management with `useSimulation`.
- Routed decision commits through the canonical `commitChoice` adapter.
- Routed day advancement through the canonical `endDay` adapter.
- Preserved the existing Phase 4 command-center model and visual information architecture.
- Kept the existing World CSS as a presentation layer while the experience migrates incrementally.
- Added an explicit loading/error state tied to the shared simulation adapter.

## Architectural rule

The UI should consume the same `SimulationState` and persistence adapter as Day 1. Individual surfaces may retain domain-specific view models, but they must not create competing save paths or mutate simulation state independently.

## Next migration slices

1. Intelligence → canonical shell + shared simulation adapter.
2. Competition → canonical shell + shared simulation adapter.
3. Learning → contextual links from decision consequences.
4. Legacy/endgame → canonical shell and final-state narrative.
5. Browser visual QA at desktop, tablet, and mobile breakpoints.

## Deferred cleanup

Historical CSS and duplicate scaffolds remain until the migrated surfaces have passed functional and visual QA. No destructive cleanup is part of this slice.
