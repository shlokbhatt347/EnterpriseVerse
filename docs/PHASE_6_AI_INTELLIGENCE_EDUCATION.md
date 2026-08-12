# Phase 6 — AI, Intelligence & Education

Phase 6 adds an evidence-based intelligence layer on top of the deterministic EnterpriseVerse simulator.

## Delivered

- Role-aware Enterprise Advisor for CEO, CFO, CMO, COO, CTO and CHRO workflows.
- Company health score derived from real simulation state.
- Prioritized insights with evidence, recommendation and rationale.
- Safe what-if workspace for price, marketing, quality, hiring and debt scenarios.
- What-if projections never mutate the real simulation state.
- Confidence labels and explicit warnings for unsafe scenarios.
- Dedicated `/intelligence` command center.
- Learning Hub now links directly to Enterprise Intelligence.
- Account menu exposes Enterprise Intelligence.

## AI boundary

Phase 6 intentionally does not require an external LLM provider. The advisor is deterministic, explainable simulation intelligence. This keeps the feature fast, testable, privacy-preserving and available offline/without a provider outage.

A future LLM-backed advisor can consume the same `EnterpriseBrief` and what-if interfaces without changing the simulation engine or trusting model-generated business state.

## Architecture

`SimulationState → Intelligence Engine → Brief / What-if → UI`

The intelligence layer reads the existing simulation contracts and does not create a second business model.

## Learning

Phase 23 remains the adaptive learning engine. Phase 6 exposes intelligence alongside it and explains company-level consequences without replacing the existing challenge/scoring logic.

## Verification

Before merge:

- `pnpm test:simulation`
- `pnpm typecheck:simulation`
- `pnpm typecheck:web`
- `pnpm check:api`
- `pnpm build:web`
- Verify `/intelligence` loads from the static GitHub Pages build.
- Verify what-if scenarios do not mutate the persisted simulation.
