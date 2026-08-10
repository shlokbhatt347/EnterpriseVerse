# Phase 18 — Real Multiplayer Infrastructure

Phase 18 turns the Phase 17 competition contracts into an authoritative real-time API foundation.

## Implemented

- Competition room creation with 2–8 player bounds.
- Quick match, friends-only, private and classroom room types.
- Server-generated room IDs and deterministic world seeds when supplied.
- Lobby membership and duplicate-join protection.
- Ready-state validation.
- Host-only start validation.
- Synchronized decision rounds: every player must submit for the current day before the server advances the room.
- Server-side validation of room status, player membership and simulation day.
- WebSocket room channel with authenticated-by-membership player identity, initial room state, presence events and heartbeat/ping support.
- Server-owned room state; decision payloads are never exposed in public room responses.
- Reconnection/presence state is reflected in the authoritative room.
- Completed-state transition after the configured simulation duration.

## Architecture rule

The multiplayer API is the authority for room membership, round state and decision timing. The browser must never be trusted to advance a round, set scores, change ratings or declare a winner.

## Current scope boundary

This phase establishes transport and synchronization infrastructure. Durable Firestore/Postgres persistence, production horizontal scaling/pub-sub, friend graph UI, matchmaking queues and the polished multiplayer client are separate layers and must be added without moving authority into the client.

## Release gate

Phase 18 is not considered production-complete merely because endpoints exist. CI must be green and the following contract behaviors must remain covered: room bounds, duplicate join, full-room rejection, host-only start, ready validation, wrong-day rejection, incomplete-round rejection, synchronized round advancement, completion and WebSocket membership/presence behavior.
