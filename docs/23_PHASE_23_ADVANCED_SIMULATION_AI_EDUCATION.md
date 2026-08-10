# Phase 23 — Advanced Simulation, Adaptive Learning & Education

Phase 23 is the intelligence/education layer on top of the deterministic Phase 19–22 foundation.

## Delivered

- Nine founder skills: finance, strategy, operations, marketing, leadership, risk, customer, innovation and ethics.
- Six high-value business scenarios covering liquidity, competition, supply resilience, people, ethics and strategic moats.
- Three decision options per scenario with explicit immediate, delayed and strategic effects.
- Multi-dimensional decision evaluation rather than a single money reward.
- Risk discipline that reacts to cash, reputation and market pressure.
- Adaptive skill profile that learns from decision quality.
- Deterministic challenge selection based on recent performance and weakest skills.
- Replay-aware scenario variety to reduce repetitive learning loops.
- End-of-run founder debrief with strengths, blind spots, lessons and next challenge.
- Bounded learning history for long-running accounts.
- Stable challenge signatures for deterministic verification.
- Dedicated learning hub at `/learning`.

## Learning philosophy

EnterpriseVerse teaches through decisions:

`Situation → trade-offs → decision → immediate impact → delayed impact → explanation → lesson → next challenge`

A player who repeatedly makes the same mistake should encounter targeted practice. A strong player should receive harder trade-offs instead of simply being shown the same beginner lesson again.

## Architecture

Phase 23 is a pure TypeScript simulation/learning layer. It has no network, browser or persistence dependency. The web learning hub uses the existing Phase 21 account save boundary for persistence.

Phase 19 remains responsible for AI competitors and the living economy. Phase 20 remains responsible for world events, memories, cause/effect and replay telemetry. Phase 22 remains responsible for multiplayer/competition. Phase 23 consumes those foundations rather than creating a competing simulation engine.

## Determinism

Challenge generation and signatures use seeded deterministic hashing. No `Math.random()`, wall-clock randomness or network state is used by the simulation package.

## Release gate

Before merge:

- `pnpm test:simulation`
- `pnpm typecheck:simulation`
- web typecheck
- production web build
- verify `/learning` loads in the static GitHub Pages build
- verify guest learning history persists locally
- verify authenticated learning history uses the existing cloud-save boundary
