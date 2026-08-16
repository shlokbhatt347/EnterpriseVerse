# EnterpriseVerse Experience Transformation — Phase 1

Branch: `feat/experience-transformation-phase1`

## Goal

Build the first canonical vertical slice before propagating the new experience to the rest of the simulation:

`Homepage → Auth → Founder onboarding → Day 1 → ExperienceShell → CEO cockpit → Decision Theater → What-if → Consequence → Contextual learning`

## Implemented

- Replaced the old root simulator composition with a public EnterpriseVerse homepage.
- Added a focused `/founder` onboarding flow that creates a real simulation business.
- Preserved `/start` as the existing player-foundation/executive entry point and routed its Founder path into `/founder`.
- Added a canonical simulation persistence adapter at `apps/web/app/lib/simulation/useSimulation.ts`.
- The adapter uses the existing `useAccount` persistence boundary, preserving local-first gameplay and existing cloud save behavior.
- Added a data-driven `CanonicalShell` with real enterprise identity, day, cash, reputation, attention count and save state.
- Added canonical EV design tokens through the existing EV 3.0 design-system file and loaded it globally.
- Added `/day1` as the first canonical CEO cockpit and first-session experience.
- Connected the first decision to the real simulation `applyChoice` path.
- Connected What-if to the real simulation state transition as a non-committing projection.
- Added consequence and causal presentation from before/after simulation state.
- Connected contextual learning to the existing founder progress and decision debrief infrastructure.
- Added responsive/mobile layouts and reduced-motion handling for the new slice.

## Functionality deliberately preserved

- Existing simulation engine in `packages/simulation` remains authoritative.
- Existing authentication and `useAccount` persistence remain authoritative.
- Existing `/start`, `/play`, `/world`, `/company`, `/intelligence`, `/learning`, `/competition`, `/endgame`, and other legacy surfaces remain in place for migration rather than being deleted.
- Existing SaveSync continues background cloud synchronization for authenticated users.
- Existing competition, learning, company-management and simulation systems are untouched outside the new adapter/presentation boundary.

## Architectural decisions

1. **Simulation truth stays in `packages/simulation`.** The new UI calls the existing engine rather than recreating simulation calculations.
2. **Persistence stays behind `useAccount`.** The new `useSimulation` adapter does not talk directly to Supabase.
3. **The canonical shell is data-driven.** No hardcoded enterprise name/day/world state is used in the new shell.
4. **EV 3.0 is the design foundation.** No new global visual framework or dependency was introduced.
5. **Migration is additive first.** Legacy pages remain until their functionality is explicitly migrated and validated.

## Validation

GitHub Actions CI run `699` completed successfully for the Phase 1 branch:

- simulation tests: pass
- simulation typecheck: pass
- web typecheck: pass
- web build: pass
- API Python syntax: pass
- required-file checks: pass

## Known limitations / next work

- The new shell currently provides navigation targets into legacy surfaces; those will be migrated after the vertical slice is accepted.
- The existing root layout still loads historical styles because removing them globally would risk regressions in legacy routes. Style convergence will happen as those routes migrate.
- The new first-session adapter currently relies on the existing local-first/cloud-sync persistence abstraction; it intentionally does not create a second Supabase persistence model.
- Visual/browser QA still needs to be performed against deployed desktop and mobile widths; CI validates type/build/test correctness, not visual fidelity.
- API/Supabase ownership and the duplicate `apps/web/src/app` scaffold remain under investigation and are not destructively changed in Phase 1.
