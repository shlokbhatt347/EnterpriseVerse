# Phase 2 multiplayer/security test matrix

The Phase 2 gate must cover:

- authenticated identity is taken from the Supabase session, never a client-supplied player id;
- room join/start/ready transitions are locked and lifecycle-validated;
- one submission per player per round is enforced by a database uniqueness constraint;
- retrying the same request ID is idempotent;
- reusing a request ID from another authenticated user is rejected;
- submissions for stale rounds or non-members are rejected;
- direct browser INSERT/UPDATE/DELETE privileges on competition state are revoked;
- private submission data is not exposed to other players;
- competition state has a monotonically increasing state_version;
- authoritative events are generated inside the same transaction as state transitions;
- leaderboard score writes cannot be supplied by browser callers;
- reconnects must re-read authoritative room state rather than trusting stale client state.
