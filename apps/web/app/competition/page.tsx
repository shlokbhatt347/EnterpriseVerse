"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getStoredUser } from "../lib/supabase-browser";
import { createRoom, findRoomByCode, joinRoom, listFriends, loadLeaderboard, loadRoom, sendFriendRequest, setReady, startRoom, submitDecision } from "./competition-browser";
import type { CompetitionPlayer, CompetitionRoom, Friend, LeaderboardRow } from "./competition-browser";
import "./competition.css";

type Scope = "global" | "friends" | "weekly" | "monthly";
const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

export default function CompetitionPage() {
  const user = getStoredUser();
  const [room, setRoom] = useState<CompetitionRoom | null>(null);
  const [players, setPlayers] = useState<CompetitionPlayer[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "Founder");
  const [friendId, setFriendId] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [scope, setScope] = useState<Scope>("global");
  const [decision, setDecision] = useState("balanced_growth");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refreshRoom = useCallback(async (id: string) => { const state = await loadRoom(id); setRoom(state.room); setPlayers(state.players); }, []);
  useEffect(() => { if (!room?.id || room.status === "completed") return; const timer = window.setInterval(() => { void refreshRoom(room.id).catch(() => undefined); }, 2500); return () => window.clearInterval(timer); }, [refreshRoom, room?.id, room?.status]);
  useEffect(() => { if (!user) return; void listFriends().then(setFriends).catch(() => undefined); }, [user]);
  useEffect(() => { if (!user) return; void loadLeaderboard(scope).then(setLeaderboard).catch(() => setLeaderboard([])); }, [scope, user]);

  const acceptedFriends = useMemo(() => friends.filter((friend) => friend.status === "accepted"), [friends]);
  const pendingIncoming = useMemo(() => friends.filter((friend) => friend.status === "pending" && friend.addressee_id === user?.id), [friends, user?.id]);
  const me = players.find((player) => player.user_id === user?.id);
  const everyoneReady = players.length >= 2 && players.every((player) => player.ready);

  async function run(action: () => Promise<void>, success?: string) {
    setBusy(true); setError(""); setMessage(""); try { await action(); if (success) setMessage(success); } catch (reason) { setError(reason instanceof Error ? reason.message : "Something went wrong."); } finally { setBusy(false); }
  }

  if (!user) return <main className="competition-shell"><section className="competition-card centered"><span className="competition-kicker">COMPETE</span><h1>Build against real founders.</h1><p>Multiplayer competitions require an EnterpriseVerse account so rooms, friendships and results stay connected to the right player.</p><Link className="competition-primary" href="/auth/signin">Sign in with email →</Link><Link className="competition-secondary" href="/">Back to simulation</Link></section></main>;

  return <main className="competition-shell">
    <header className="competition-header"><div><Link className="competition-brand" href="/">ENTERPRISEVERSE</Link><span className="competition-kicker">COMPETITION</span><h1>Outthink the market.</h1><p>Same world. Different decisions. One leaderboard.</p></div><div className="competition-user"><strong>{displayName}</strong><span>{acceptedFriends.length} friends</span></div></header>

    <div className="competition-grid">
      <section className="competition-card room-card">
        <div className="card-top"><div><span className="competition-kicker">01 · PLAY</span><h2>{room ? "Your competition room" : "Start a competition"}</h2></div>{room && <span className={`room-status ${room.status}`}>{room.status}</span>}</div>
        {!room ? <div className="room-create">
          <label>Display name<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} /></label>
          <button className="competition-primary full" disabled={busy || !displayName.trim()} onClick={() => run(async () => { const next = await createRoom(displayName); await refreshRoom(next.id); }, "Room created. Share the code with your friend.")}>Create friend room</button>
          <div className="join-divider"><span>or join a room</span></div>
          <div className="join-row"><input value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} placeholder="6-character code" maxLength={6} /><button className="competition-secondary" disabled={busy || roomCode.length !== 6} onClick={() => run(async () => { const found = await findRoomByCode(roomCode); if (!found) throw new Error("Room not found. Check the code and try again."); await joinRoom(found, displayName); await refreshRoom(found.id); }, "Joined the room.")}>Join</button></div>
        </div> : <div>
          <div className="room-code"><span>ROOM CODE</span><strong>{room.code}</strong><small>Share this code with your friend</small></div>
          <div className="player-list">{players.map((player) => <div className="player-row" key={player.user_id}><span className={`presence ${player.connected ? "online" : ""}`} /><div><strong>{player.display_name}{player.user_id === room.host_id ? " · Host" : ""}</strong><small>{player.ready ? "Ready" : "Waiting"}</small></div><span className={player.ready ? "ready" : "waiting"}>{player.ready ? "READY" : "WAITING"}</span></div>)}</div>
          {room.status === "lobby" && <div className="room-actions"><button className="competition-secondary" disabled={busy} onClick={() => run(async () => { await setReady(room.id, !Boolean(me?.ready)); await refreshRoom(room.id); })}>{me?.ready ? "I'm not ready" : "I'm ready"}</button>{room.host_id === user.id && <button className="competition-primary" disabled={busy || !everyoneReady} onClick={() => run(async () => { await startRoom(room.id); await refreshRoom(room.id); }, "Competition started!")}>Start competition</button>}</div>}
          {room.status === "active" && <div className="active-round"><span>ROUND {room.current_round} / {room.duration_rounds}</span><h3>Choose your strategy</h3><div className="decision-options">{[["balanced_growth","Balanced growth","Protect cash while building sustainable demand."],["aggressive_growth","Aggressive growth","Trade margin and cash for faster expansion."],["defensive_cash","Defensive cash","Prioritise liquidity and resilience." ]].map(([id,title,desc]) => <button type="button" key={id} className={decision === id ? "selected" : ""} onClick={() => setDecision(id)}><strong>{title}</strong><span>{desc}</span></button>)}</div><button className="competition-primary full" disabled={busy} onClick={() => run(async () => { await submitDecision(room.id, room.current_round, decision); await refreshRoom(room.id); }, "Decision submitted. Waiting for the other founders…")}>Submit round decision →</button></div>}
          {room.status === "completed" && <div className="completed"><strong>Competition complete.</strong><span>Your final result will appear on the leaderboard after scoring.</span></div>}
        </div>}
      </section>

      <section className="competition-card leaderboard-card"><div className="card-top"><div><span className="competition-kicker">02 · RANKINGS</span><h2>Leaderboard</h2></div><span className="live-badge">● LIVE</span></div><div className="scope-tabs">{(["global","friends","weekly","monthly"] as Scope[]).map((item) => <button key={item} className={scope === item ? "active" : ""} onClick={() => setScope(item)}>{item}</button>)}</div><div className="leaderboard">{leaderboard.length ? leaderboard.map((row, index) => <div className={`leader-row ${row.user_id === user.id ? "self" : ""}`} key={`${row.user_id}-${row.achieved_at}-${index}`}><strong className="rank">{index + 1}</strong><div className="leader-avatar">{(row.profiles?.display_name ?? "F").slice(0, 1).toUpperCase()}</div><div className="leader-name"><strong>{row.profiles?.display_name ?? "Founder"}{row.user_id === user.id ? " · You" : ""}</strong><small>{row.metrics?.scenario ? String(row.metrics.scenario) : "Enterprise competition"}</small></div><strong className="score">{money(Number(row.score))}</strong></div>) : <div className="empty-state">No scores yet. Finish a competition to claim the first place.</div>}</div></section>

      <section className="competition-card friends-card"><div className="card-top"><div><span className="competition-kicker">03 · NETWORK</span><h2>Friends</h2></div></div><div className="friend-add"><input value={friendId} onChange={(e) => setFriendId(e.target.value)} placeholder="Enter friend's user ID" /><button className="competition-secondary" disabled={busy || !friendId.trim()} onClick={() => run(async () => { await sendFriendRequest(friendId); setFriendId(""); const next = await listFriends(); setFriends(next); }, "Friend request sent.")}>Add</button></div>{pendingIncoming.length > 0 && <div className="friend-notice">{pendingIncoming.length} incoming request{pendingIncoming.length > 1 ? "s" : ""} need your attention.</div>}<div className="friend-list">{friends.length ? friends.map((friend) => <div className="friend-row" key={friend.id}><div><strong>{friend.requester_id === user.id ? friend.addressee_id : friend.requester_id}</strong><small>{friend.status}</small></div></div>) : <div className="empty-state">Add a friend to unlock friend-only rankings.</div>}</div></section>
    </div>
    {(message || error) && <div className={error ? "toast error" : "toast success"} role={error ? "alert" : "status"}>{error || message}</div>}
  </main>;
}
