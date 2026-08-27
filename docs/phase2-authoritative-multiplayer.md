# Phase 2 — Authoritative Multiplayer Security Contract

## Authority
All competition mutations are authenticated RPC operations. Browser roles have no direct INSERT/UPDATE/DELETE privileges on competition state tables.

## State transitions
Competition room lifecycle mutations lock the room row before validating and applying the transition. `state_version` increments on authoritative state changes.

## Submissions
Round submissions validate authenticated identity, membership, active round and decision bounds. The database uniqueness constraint prevents duplicate submissions for the same player and round. Request keys make retries idempotent.

## Data exposure
Private submission rows are readable only by their owner. Competition request keys and internal event storage are not directly writable by browser roles.

## Realtime
Realtime delivery is a notification mechanism. Clients must reconcile against authoritative room state after reconnect or missed events.

## Security invariants
- Client-provided player IDs are never used as authoritative identity.
- Client-provided scores are never accepted by the competition leaderboard path.
- Host authority is checked against the authenticated caller.
- Room capacity and lifecycle transitions are checked under row locking.
- Duplicate state-changing requests are idempotent when a request ID is supplied.
- Cross-room/private data access is rejected by RPC authorization and RLS.
