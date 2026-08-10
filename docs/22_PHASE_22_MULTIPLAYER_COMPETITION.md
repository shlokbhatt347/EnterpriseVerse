# Phase 22 — Multiplayer & Competition

## Goal

Turn EnterpriseVerse into a persistent competitive product without coupling the competition layer to the browser's local simulation state.

## Delivered foundation

- Persistent friend relationships in Supabase.
- Persistent competition rooms and room participants.
- Round submissions with one submission per player per round.
- Deterministic competition scoring primitives.
- Global, friends-only, weekly and monthly leaderboard scopes.
- RLS policies so users can only mutate their own friendship/room participation data.
- Public leaderboard reads without exposing private business saves.
- Room polling from the static GitHub Pages client, so multiplayer does not depend on an unavailable long-running FastAPI server.
- Room lifecycle: lobby → active → completed.
- Host-only start control and player-count/ready validation.
- Duplicate-submission protection at the database layer.
- Competition UI at `/competition` with create/join/ready/start/submit flow and leaderboard views.

## Competition model

A competition is a shared room containing multiple founders. All players receive the same world seed and round/day. Each player submits one decision for the current round. A round advances only after every active participant has submitted.

The browser never writes directly to leaderboard rows. Leaderboard writes go through a database function so score calculation has one canonical implementation and can be hardened further when the authoritative simulation engine moves server-side in the production phase.

## Supabase migration

Run `supabase/migrations/20260810_phase22_multiplayer_competition.sql` in the connected Supabase project.

The migration is idempotent and may safely be applied after Phase 21.

## Static deployment

EnterpriseVerse currently deploys as a static Next.js export on GitHub Pages. Therefore `/competition` uses Supabase REST polling for room state rather than assuming a persistent FastAPI process is available at the Pages URL. This keeps the feature deployable on the current architecture while leaving the room domain portable to Supabase Realtime/server authority later.

## Security boundary

The anon key is browser-safe. RLS is the security boundary. Room membership, friendship ownership and leaderboard insertion are database-enforced. No service-role key is shipped to the browser.

## Scope deliberately deferred

- Voice/chat moderation
- Tournament brackets
- Server-authoritative simulation execution
- Sophisticated anti-cheat telemetry
- Ranked matchmaking rating
- Real-time websocket transport

Those belong after the competition foundation is proven and the authoritative simulation layer is ready.
