# Phase 11 — Advanced Living World

This phase adds a small, dependency-free living-world domain layer that can be integrated with the existing simulation without duplicating business logic.

## Included
- Actor relationship, trust and activity state.
- Bounded values from 0–100.
- Deterministic day advancement.
- Relationship trend classification.
- Safe handling of backwards time.
- Regression coverage for immutability and bounds.

## Integration rule
The existing simulation remains the source of truth. These helpers must be integrated through the canonical day-advance pipeline rather than called independently from UI code.

## Completion gate
Run the full simulation suite, TypeScript checks and web build. Merge only when CI is completely green.
