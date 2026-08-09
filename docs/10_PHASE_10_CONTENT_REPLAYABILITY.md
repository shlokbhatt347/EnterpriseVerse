# Phase 10 — Content + Replayability

## Objective
Make EnterpriseVerse meaningfully different from run to run without changing the canonical simulation rules.

## What Phase 10 adds
- Curated business archetypes with distinct strategic identities.
- Scenario packs covering market, finance, operations, people, supply and macro conditions.
- Difficulty profiles that tune pressure without changing the underlying domain model.
- Deterministic seeded content selection so a run is reproducible.
- Replay fingerprints for comparing runs safely.
- Content metadata suitable for the future UI/UX layer.

## Design principles
1. Content describes situations; the simulation engine remains responsible for consequences.
2. Seeded selection is deterministic and never uses global mutable randomness.
3. Difficulty changes frequency/pressure, not hidden rules.
4. No scenario should have a universally correct choice.
5. Existing Phase 1–9 state and APIs remain backward compatible.

## Initial content targets
- 6 business archetypes.
- 6 scenario packs.
- 4 difficulty profiles.
- 30 curated scenario prompts.
- Deterministic selection and replay fingerprinting.

## Release gate
Phase 10 is complete only when the content catalog is consumed by the simulation or UI, all deterministic tests pass, the existing simulation suite remains green, TypeScript remains clean, and CI passes from a clean checkout.