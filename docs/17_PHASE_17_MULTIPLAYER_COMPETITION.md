# Phase 17 — Multiplayer, Friends & Competitive Enterprise

Phase 17 defines the competitive layer on top of the deterministic Phase 16 engine: 2–8 player shared-world rooms, synchronized decisions, verified run records, ratings, leaderboards, friend challenges, replays and classroom-ready competition contracts.

## Core rules

- The server must be authoritative for multiplayer state and competitive results.
- Clients submit decisions; they never submit authoritative scores, ratings or final outcomes.
- All players in a room share one world seed and synchronized simulation day.
- Decisions are resolved as rounds so players can act independently and then see market consequences together.
- Competitive scores combine financial health, customers, reputation, market share, satisfaction and profitability rather than rewarding cash alone.
- Verified runs contain the world seed, simulation version, decision history, final score and a deterministic verification hash.
- Rating and leaderboard records must accept only verified completed runs.

## Deliverables

- Competition room/lobby contracts.
- 2–8 player bounds.
- Ready/start validation.
- Synchronized decision submissions and round advancement.
- Competitive scoring.
- Verified-run envelope.
- Rating tiers and Elo-style rating calculation.
- Deterministic ranking tie-breakers.
- Friend/private/quick/classroom competition types.
- Public API contracts designed for the existing Phase 15 account layer.

## Architecture

The contracts remain inside the simulation package and have no Firebase or browser-only dependencies. The web/API layer can bind them to the existing account and persistence boundary while keeping the simulation deterministic and testable.
