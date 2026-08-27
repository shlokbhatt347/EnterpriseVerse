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

if (migration.includes("phase22_submit_decision(uuid, integer, text);")) {
  throw new Error("Legacy three-argument submission contract must not be restored.");
}

console.log(`Phase 2 authority contract verified (${required.length} checks).`);
