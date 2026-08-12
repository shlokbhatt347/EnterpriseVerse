# Phase 7 — Global Endgame + Competition Ecosystem

This document is the implementation contract for Phase 7.

- Company-vs-company competition uses existing competition infrastructure.
- Global and role leaderboards are derived from authoritative results.
- Seasons are explicit, time-bounded, and server-controlled.
- Company and player achievements are deterministic and idempotent.
- Company timeline/memory derives from the existing event/audit history where possible.
- Endgame outcomes include continued operation, IPO, acquisition, merger, and failure/recovery paths only where current Phase 5 state supports them.
- UX surfaces progression, ranking, achievements, seasons, history, and endgame without creating a separate game state.
- All mutations are server-authorized RPCs; no client-controlled scores/ranks.
