# Phase 4 — Strategic Player Experience + Business Intelligence

Phase 4 turns the authoritative Phase 3 simulation state into a typed, explainable player-facing intelligence surface.

## Architecture

`authoritative SimulationState -> Phase 4 projection -> intelligence/reporting -> decision preview/planning -> UI`

The presentation layer never mutates simulation state. Decisions continue to flow through the existing authoritative simulation APIs.

## Implemented surface

- canonical read-only state projection with information-quality labels
- executive business metrics
- market intelligence and trend signals
- financial intelligence and derived profit/valuation
- customer trust, satisfaction, acquisition and churn signals
- operations capacity, inventory, quality and stockout visibility
- workforce morale, productivity and retention signals
- competitor ranking, strategy and threat assessment
- ranked attention/alert signals
- decision briefs with affected systems, horizon and uncertainty
- strategic priorities for stability, growth, profitability, market share, innovation and customer value
- consequence/event timeline
- responsive command-centre route at `/phase4`
- deterministic, mutation-free projection tests

## Information asymmetry

Authoritative facts are marked `known`. Derived player intelligence is marked `estimated`. The interface explicitly avoids presenting estimates as guarantees.

## Authority rule

The web client reads simulation state and submits decisions through existing simulation APIs. It does not directly mutate cash, demand, inventory, reputation, workforce, competition or other authoritative fields.

## QA contract

Phase 4 must retain all existing Phase 1–3 simulation, typecheck, security, architecture, accessibility and production gates. New Phase 4 tests cover projection immutability, bounded presentation values, intelligence alignment, strategic planning, decision briefs and ordered history.
