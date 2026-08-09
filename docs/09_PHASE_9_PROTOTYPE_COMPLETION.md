# Phase 9 — Prototype Completion

## Objective
Turn the existing simulation engine into a coherent first prototype that can be played from start to finish without developer guidance.

## Definition of done
- Start a new enterprise.
- Complete a guided first-run experience.
- Run multiple business days with meaningful decisions.
- See financial, market, operational, workforce and world consequences.
- Review a business timeline.
- Finish a run with an enterprise and learning report.
- Resume an existing run and replay safely.
- Work on desktop and mobile layouts.
- No placeholder routes or broken states.
- Simulation, typecheck, web build and CI remain green.

## Workstreams

### 9A — Complete game flow
Start → onboarding → Day 1 → daily loop → progression → end of run → report → replay/new enterprise.

### 9B — Command centre
Unify cash, revenue, profit, customers, reputation, market share, employees, runway, business stage, risks and current objective in one responsive dashboard.

### 9C — Daily decision UX
Show the situation, relevant context, choices, immediate effects and later consequences without exposing a single 'correct' answer.

### 9D — Business timeline
Record meaningful milestones and major decisions with their resulting consequences.

### 9E — Enterprise report
Summarize financial, market, operations, workforce, strategy and learning outcomes from the actual run.

### 9F — Guided first run
Use the first three days to teach core concepts through gameplay, then remove guidance.

### 9G — Reliability and polish
Validate save/resume, reset, replay, old-state compatibility, empty/error states, mobile layout, accessibility basics and production builds.

## Engineering rules
1. Reuse existing domain types and simulation engines; do not duplicate business logic in the UI.
2. Preserve backward compatibility for existing saved simulation state.
3. Every new state transition must have a regression test.
4. Prefer deterministic simulation tests with explicit seeds.
5. Keep prototype scope focused: no multiplayer or major new AI architecture in Phase 9.

## Release gate
The phase is complete only when the complete user journey works and the repository's existing CI checks pass without introducing regressions.