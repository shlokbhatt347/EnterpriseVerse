# Competition — Canonical Experience Migration

## Goal

Bring the multiplayer Competition surface into the EnterpriseVerse canonical experience without collapsing its distinct multiplayer persistence model into the single-player simulation adapter.

## Architecture

- `CanonicalShell` owns the global EnterpriseVerse navigation and executive KPI context.
- Competition retains its server-authoritative room, player, friend, leaderboard, and decision APIs.
- `competition-sim.ts` remains the deterministic per-player competition simulation adapter.
- The competition simulation is mirrored into the canonical shell through a lightweight browser event so shell KPIs update after submitted decisions.
- Session storage remains a best-effort browser cache; server competition state remains authoritative.

## UX contract

Competition should feel like the same EnterpriseVerse product, while preserving multiplayer-specific concepts:

1. Room and player state
2. Readiness and round progression
3. Friend/network actions
4. Live leaderboard
5. Decision submission and deterministic replay

No multiplayer data ownership is moved into `useSimulation` merely for visual consistency.

## Follow-up

- Browser QA across desktop/tablet/mobile.
- Verify realtime room updates and fallback polling with the canonical shell mounted.
- Remove obsolete competition-only shell scaffolding only after visual parity is verified.
