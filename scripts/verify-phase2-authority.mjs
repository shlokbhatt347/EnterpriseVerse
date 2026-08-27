import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20260827_phase2_final_hardening.sql", "utf8");
const retryFix = readFileSync("supabase/migrations/20260827_phase2_idempotency_retry_fix.sql", "utf8");

const required = [
  [migration, "request_fingerprint", "request fingerprint binding"],
  [migration, "for update", "room/request row locking"],
  [migration, "auth.uid()", "authenticated identity"],
  [migration, "phase22_finalize_completed_room", "server-side finalization"],
  [migration, "revoke all on public.competition_request_keys", "private idempotency records"],
  [migration, "competition_submissions_select_own", "private submission reads"],
  [retryFix, "return existing_request.response", "replayable idempotent retries"],
];

for (const [source, marker, label] of required) {
  if (!source.includes(marker)) throw new Error(`Phase 2 contract missing: ${label}`);
}

// The migration must remove the legacy 3-argument overload, but must never
// recreate or grant access to that overload. Merely mentioning it in a DROP
// FUNCTION statement is intentional and is not a contract violation.
const legacyCreateOrGrant = /(?:create\s+or\s+replace\s+function|grant\s+execute\s+on\s+function)\s+public\.phase22_submit_decision\s*\(\s*uuid\s*,\s*integer\s*,\s*text\s*\)/i;
if (legacyCreateOrGrant.test(migration)) {
  throw new Error("Legacy three-argument submission contract must not be restored or granted.");
}

console.log(`Phase 2 authority contract verified (${required.length} checks).`);
