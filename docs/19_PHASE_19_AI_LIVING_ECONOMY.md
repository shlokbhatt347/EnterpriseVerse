# Phase 19 — AI Competitors + Living Economy

Phase 19 adds deterministic, replayable AI competitors and a continuously evolving market layer without replacing the Phase 16 simulation engine.

## Release goals

- 100 deterministic personality profiles from a world seed.
- 20 configurable competitor agents with distinct strategies and personalities.
- Five intelligence tiers: beginner, average, smart, expert, elite.
- Competitors evaluate price, quality, growth, niche and hold actions against the current market and player state.
- Competitors adapt through memory-aware decision scoring.
- Market demand, price, pressure, innovation demand, confidence, supply reliability, inflation and event pressure evolve by day.
- The same seed and inputs produce the same living-economy step and replay signature.
- Player market state can consume the evolving market without allowing competitors to mutate authoritative simulation state directly.

## Replayability contract

A run is identified by its seed and decision history. Phase 19 never uses wall-clock randomness for simulation decisions. All generated personalities, market shocks and competitor choices derive from the supplied seed and simulation day.

## Architecture

Phase 19 is a pure simulation layer. It has no browser, network or persistence dependencies. Multiplayer infrastructure remains authoritative in the API layer; Phase 19 only supplies deterministic world evolution and competitor decisions.

## Future layers

Phase 20 can use competitor behavior and player history for adaptive education. Phase 21 can expose personality discovery, challenges and progression. Phase 22 can harden the simulation/API boundary for production scale.
