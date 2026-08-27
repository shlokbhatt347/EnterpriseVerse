# Phase 2 final hardening

## Acceptance target

Competition mutations are authoritative, authenticated, authorized, idempotent, serialized per room, and protected from direct browser table writes.

## Implemented final hardening

- Submission RPC requires a UUID request id.
- The legacy three-argument submission RPC is removed.
- Decision IDs are restricted to the three decisions exposed by the competition UI.
- Request fingerprints bind a request id to user, room, round, and decision.
- Retrying the same request returns the stored result.
- Reusing a request id for different input is rejected.
- The room row is locked during submission/resolution, serializing state transitions per room.
- One submission per player/round remains enforced by the existing unique constraint.
- Round advancement and final completion occur in the same transaction as the accepted submission.
- Authoritative state_version is incremented for every accepted state transition.
- Competition events record accepted submissions and round completion.
- Final scores are derived server-side from persisted decisions; clients cannot provide a numeric score.
- Direct browser INSERT/UPDATE/DELETE privileges remain revoked for competition state tables.
- Submission reads are limited to the authenticated submitting player.
- Database checks enforce positive state versions, valid rounds, and valid event versions.
- API-side validation mirrors the database decision allowlist.

## Verified against the connected Supabase project

- RLS is enabled on competition rooms, players, submissions, events, request keys, and leaderboard tables.
- Authenticated direct INSERT/UPDATE/DELETE privileges are disabled on authoritative competition tables.
- Anonymous execution of the submission RPC is disabled.
- Direct authenticated execution of the internal finalizer is disabled.
- The three-argument submission RPC no longer exists.
- The four-argument submission RPC exists and is executable only by authenticated users.
- A non-member authenticated identity sees zero competition rooms, players, or submissions through direct RLS reads.

## Realtime design

Competition Realtime is treated as a notification channel only. The browser responds to change events by re-reading authoritative state through the secured room-state RPC. The browser does not apply authoritative economic or competition state from an event payload.

The connected Supabase project does not permit this project role to alter ownership of `realtime.messages`, so private-channel RLS policies were not fabricated or applied. The existing Postgres Changes path remains protected by the competition-table RLS policies.

## Remaining platform-level warnings

Supabase's security advisor still reports the project's existing authenticated `SECURITY DEFINER` functions. These are broader application functions outside the competition mutation boundary; Phase 2 does not silently revoke them because doing so would break unrelated product flows. Competition mutation RPCs are explicitly scoped and checked as described above.
