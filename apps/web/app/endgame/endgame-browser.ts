"use client";

import { loadLeaderboard, type LeaderboardRow } from "../competition/competition-browser";

type Season = { id: string; season_key: string; name: string; theme: string; status: string; starts_at: string; ends_at: string | null };
type StoredSession = { access_token: string; user: { id: string } };
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SESSION_KEY = "enterpriseverse:supabase-session:v1";
const TIMEOUT_MS = 10_000;

function session(): StoredSession | null {
  try { const raw = window.localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) as StoredSession : null; } catch { return null; }
}

export async function loadActiveSeason(): Promise<Season | null> {
  const current = session();
  if (!current?.access_token || !url || !anonKey) return null;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${url}/rest/v1/rpc/get_active_phase7_season`, {
      method: "POST",
      headers: { apikey: anonKey, Authorization: `Bearer ${current.access_token}`, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const value = await response.json() as Season | Season[];
    return Array.isArray(value) ? value[0] ?? null : value;
  } catch {
    return null;
  } finally { window.clearTimeout(timer); }
}

export async function loadGlobalRankings(): Promise<LeaderboardRow[]> {
  try { return await loadLeaderboard("global"); } catch { return []; }
}
