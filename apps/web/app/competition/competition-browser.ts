"use client";

import { supabaseConfigured } from "../lib/supabase-browser";

type CompetitionRoom = { id: string; code: string; host_id: string; competition_type: string; status: string; max_players: number; duration_rounds: number; current_round: number; world_seed: number; created_at: string; updated_at: string };
type CompetitionPlayer = { room_id: string; user_id: string; display_name: string; ready: boolean; connected: boolean; joined_at: string };
type Friend = { id: string; requester_id: string; addressee_id: string; status: string };
type LeaderboardRow = { user_id: string; scope: string; score: number; rank?: number | null; metrics: Record<string, unknown>; achieved_at: string; profiles?: { display_name: string } | null };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SESSION_KEY = "enterpriseverse:supabase-session:v1";

type StoredSession = { access_token: string; refresh_token: string; expires_at?: number; expires_in: number; user: { id: string } };
function session(): StoredSession | null { try { const raw = window.localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) as StoredSession : null; } catch { return null; } }
function requireSession() { if (!supabaseConfigured || !url || !anonKey) throw new Error("Cloud multiplayer is not configured."); const value = session(); if (!value?.access_token) throw new Error("Sign in with email to play multiplayer."); return value; }
async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const current = requireSession();
  const headers = new Headers(init.headers); headers.set("apikey", anonKey); headers.set("Authorization", `Bearer ${current.access_token}`); headers.set("Content-Type", "application/json");
  const response = await fetch(`${url}${path}`, { ...init, headers, cache: "no-store" });
  const raw = await response.text(); let body: unknown = null; try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }
  if (!response.ok) throw new Error(typeof body === "object" && body !== null && "message" in body && typeof body.message === "string" ? body.message : typeof body === "object" && body !== null && "details" in body && typeof body.details === "string" ? body.details : `Cloud request failed (${response.status}).`);
  return body as T;
}

function randomCode() { const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let code = ""; for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)]; return code; }
function randomSeed() { return Math.floor(Math.random() * 0x7fffffff); }

export async function createRoom(displayName: string, durationRounds = 30) {
  const current = requireSession();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const rows = await rest<CompetitionRoom[]>("/rest/v1/competition_rooms?select=*&limit=1", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ code: randomCode(), host_id: current.user.id, competition_type: "friends_only", status: "lobby", max_players: 4, duration_rounds: durationRounds, current_round: 1, world_seed: randomSeed() }) });
      const room = rows[0];
      if (!room) throw new Error("Room creation returned no room.");
      await rest("/rest/v1/competition_players", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ room_id: room.id, user_id: current.user.id, display_name: displayName.trim(), ready: false, connected: true }) });
      return room;
    } catch (error) {
      if (!(error instanceof Error) || !/duplicate|unique/i.test(error.message) || attempt === 4) throw error;
    }
  }
  throw new Error("Unable to create a unique room code.");
}

export async function findRoomByCode(code: string) {
  const rows = await rest<CompetitionRoom[]>(`/rest/v1/competition_rooms?select=*&code=eq.${encodeURIComponent(code.trim().toUpperCase())}&limit=1`);
  return rows[0] ?? null;
}

export async function loadRoom(roomId: string) {
  const [rooms, players] = await Promise.all([
    rest<CompetitionRoom[]>(`/rest/v1/competition_rooms?select=*&id=eq.${encodeURIComponent(roomId)}&limit=1`),
    rest<CompetitionPlayer[]>(`/rest/v1/competition_players?select=*&room_id=eq.${encodeURIComponent(roomId)}&order=joined_at.asc`),
  ]);
  return { room: rooms[0] ?? null, players };
}

export async function joinRoom(room: CompetitionRoom, displayName: string) {
  const current = requireSession();
  if (room.status !== "lobby") throw new Error("This competition has already started.");
  await rest("/rest/v1/competition_players?on_conflict=room_id,user_id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ room_id: room.id, user_id: current.user.id, display_name: displayName.trim(), ready: false, connected: true }) });
}

export async function setReady(roomId: string, ready: boolean) {
  const current = requireSession();
  await rest(`/rest/v1/competition_players?room_id=eq.${encodeURIComponent(roomId)}&user_id=eq.${encodeURIComponent(current.user.id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ ready, connected: true }) });
}

export async function startRoom(roomId: string) {
  const current = requireSession();
  const players = await rest<CompetitionPlayer[]>(`/rest/v1/competition_players?select=*&room_id=eq.${encodeURIComponent(roomId)}`);
  if (players.length < 2 || players.some((player) => !player.ready)) throw new Error("At least two ready players are required.");
  await rest(`/rest/v1/competition_rooms?id=eq.${encodeURIComponent(roomId)}&host_id=eq.${encodeURIComponent(current.user.id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "active" }) });
}

export async function submitDecision(roomId: string, round: number, decisionId: string) {
  const result = await rest<{ submitted: number; players: number; round_resolved: boolean; completed: boolean; current_round: number }>("/rest/v1/rpc/phase22_submit_decision", { method: "POST", body: JSON.stringify({ p_room_id: roomId, p_round: round, p_decision_id: decisionId }) });
  if (!result) throw new Error("The competition server did not confirm your decision.");
  return result;
}

export async function listFriends() {
  const current = requireSession();
  return rest<Friend[]>(`/rest/v1/friendships?select=*&or=(requester_id.eq.${encodeURIComponent(current.user.id)},addressee_id.eq.${encodeURIComponent(current.user.id)})&order=updated_at.desc`);
}

export async function sendFriendRequest(userId: string) {
  const current = requireSession();
  if (userId === current.user.id) throw new Error("You cannot add yourself.");
  await rest("/rest/v1/friendships", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ requester_id: current.user.id, addressee_id: userId.trim(), status: "pending" }) });
}

export async function updateFriendship(id: string, status: "accepted" | "declined" | "blocked") {
  await rest(`/rest/v1/friendships?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status }) });
}

export async function loadLeaderboard(scope: "global" | "friends" | "weekly" | "monthly") {
  const current = requireSession();
  const rows = await rest<LeaderboardRow[]>(`/rest/v1/leaderboard_scores?select=user_id,scope,score,rank,metrics,achieved_at,profiles(display_name)&scope=eq.${scope}&order=score.desc,achieved_at.asc&limit=50`);
  if (scope !== "friends") return rows;
  const friends = await listFriends();
  const ids = new Set([current.user.id, ...friends.filter((friend) => friend.status === "accepted").map((friend) => friend.requester_id === current.user.id ? friend.addressee_id : friend.requester_id)]);
  return rows.filter((row) => ids.has(row.user_id));
}

export type { CompetitionRoom, CompetitionPlayer, Friend, LeaderboardRow };
