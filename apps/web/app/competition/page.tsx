"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createRoom, findRoomByCode, joinRoom, listFriendNotifications, listFriends, loadLeaderboard, loadRoom, markNotificationRead, respondFriendRequest, searchPeople, sendFriendRequest, setReady, startRoom, submitDecision } from "./competition-browser";
import { getStoredUser } from "../lib/supabase-browser";
import type { CompetitionPlayer, CompetitionRoom, Friend, FriendRequestNotification, LeaderboardRow, Person } from "./competition-browser";
import "./competition.css";

type Scope = "global" | "friends" | "weekly" | "monthly";
type ActionKey = string;
const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

export default function CompetitionPage() {
  const user = getStoredUser();
  const userId = user?.id ?? null;
  const [room, setRoom] = useState<CompetitionRoom | null>(null);
  const [players, setPlayers] = useState<CompetitionPlayer[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "Founder");
  const [friendQuery, setFriendQuery] = useState("");
  const [friendResults, setFriendResults] = useState<Person[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [notifications, setNotifications] = useState<FriendRequestNotification[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [scope, setScope] = useState<Scope>("global");
  const [decision, setDecision] = useState("balanced_growth");
  const [activeActions, setActiveActions] = useState<Set<ActionKey>>(new Set());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const networkRefreshInFlight = useRef(false);
  const roomRefreshInFlight = useRef<string | null>(null);

  const refreshRoom = useCallback(async (id: string) => {
    if (roomRefreshInFlight.current === id) return;
    roomRefreshInFlight.current = id;
    try {
      const state = await loadRoom(id);
      setRoom(state.room);
      setPlayers(state.players);
    } finally {
      if (roomRefreshInFlight.current === id) roomRefreshInFlight.current = null;
    }
  }, []);

  const refreshNetwork = useCallback(async () => {
    if (networkRefreshInFlight.current) return;
    networkRefreshInFlight.current = true;
    try {
      const [friendRows, notificationRows] = await Promise.all([listFriends(), listFriendNotifications()]);
      setFriends(friendRows);
      setNotifications(notificationRows);
    } finally {
      networkRefreshInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (!room?.id || room.status === "completed") return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshRoom(room.id).catch(() => undefined);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [refreshRoom, room?.id, room?.status]);

  useEffect(() => {
    if (!userId) return;
    void refreshNetwork().catch(() => undefined);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshNetwork().catch(() => undefined);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [refreshNetwork, userId]);

  useEffect(() => {
    if (!userId || friendQuery.trim().length < 2) {
      setFriendResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchPeople(friendQuery).then(setFriendResults).catch(() => setFriendResults([]));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [friendQuery, userId]);

  useEffect(() => {
    if (!userId) return;
    void loadLeaderboard(scope).then(setLeaderboard).catch(() => setLeaderboard([]));
  }, [scope, userId]);

  const acceptedFriends = useMemo(() => friends.filter((friend) => friend.status === "accepted"), [friends]);
  const incomingRequests = useMemo(() => friends.filter((friend) => friend.status === "pending" && friend.addressee_id === userId), [friends, userId]);
  const incomingFriendNotifications = useMemo(() => notifications.filter((notification) => notification.type === "friend_request" && !notification.read_at), [notifications]);
  const me = players.find((player) => player.user_id === userId);
  const everyoneReady = players.length >= 2 && players.every((player) => player.ready);

  async function run(actionKey: ActionKey, fn: () => Promise<void>, success?: string) {
    setActiveActions((current) => {
      const next = new Set(current);
      next.add(actionKey);
      return next;
    });
    setError("");
    setMessage("");
    try {
      await fn();
      if (success) setMessage(success);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong.");
    } finally {
      setActiveActions((current) => {
        const next = new Set(current);
        next.delete(actionKey);
        return next;
      });
    }
  }

  const isBusy = (key: ActionKey) => activeActions.has(key);

  if (!user) return <main className="competition-shell"><section className="competition-card centered"><span className="competition-kicker">COMPETE</span><h1>Build against real founders.</h1><p>Multiplayer competitions require an EnterpriseVerse account so rooms, friendships and results stay connected to the right player.</p><Link className="competition-primary" href="/auth/signin">Sign in with email →</Link><Link className="competition-secondary" href="/">Back to simulation</Link></section></main>;

  return <main className="competition-shell">
    <header className="competition-header"><div><Link className="competition-brand" href="/">ENTERPRISEVERSE</Link><span className="competition-kicker">COMPETITION</span><h1>Outthink the market.</h1><p>Same world. Different decisions. One leaderboard.</p></div><div className="competition-user"><strong>{displayName}</strong><span>{acceptedFriends.length} friends</span><Link className="competition-secondary" href="/enterprise">Build with co-founders →</Link></div></header>

    {incomingRequests.length > 0 && <section className="friend-request-panel" aria-label="Friend requests"><div className="friend-request-heading"><div><span className="competition-kicker">NETWORK · ACTION REQUIRED</span><h2>Friend requests</h2><p>Requests remain visible until you accept or decline them.</p></div><span className="friend-request-count">{incomingRequests.length} pending</span></div><div className="friend-request-list">{incomingRequests.map((friend) => { const notification = incomingFriendNotifications.find((item) => String(item.metadata.friendship_id ?? "") === friend.id); const acceptKey = `accept:${friend.id}`; const declineKey = `decline:${friend.id}`; return <article className="friend-request-card" key={friend.id}><div className="friend-request-avatar">F</div><div className="friend-request-copy"><strong>{notification?.title ?? "New friend request"}</strong><span>{notification?.body ?? "A founder wants to connect with you."}</span><small>Pending request</small></div><div className="friend-request-actions"><button className="competition-primary" disabled={isBusy(acceptKey)} onClick={() => run(acceptKey, async () => { await respondFriendRequest(friend.id, "accepted"); setFriends((current) => current.map((item) => item.id === friend.id ? { ...item, status: "accepted", updated_at: new Date().toISOString() } : item)); if (notification) { setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item)); void markNotificationRead(notification.id).catch(() => undefined); } }, "Friend request accepted.")}>{isBusy(acceptKey) ? "Accepting…" : "Accept"}</button><button className="competition-secondary" disabled={isBusy(declineKey)} onClick={() => run(declineKey, async () => { await respondFriendRequest(friend.id, "declined"); setFriends((current) => current.map((item) => item.id === friend.id ? { ...item, status: "declined", updated_at: new Date().toISOString() } : item)); if (notification) { setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item)); void markNotificationRead(notification.id).catch(() => undefined); } }, "Friend request declined.")}>{isBusy(declineKey) ? "Declining…" : "Decline"}</button></div></article>; })}</div></section>}

    <div className="competition-grid">
      <section className="competition-card room-card"><div className="card-top"><div><span className="competition-kicker">01 · PLAY</span><h2>{room ? "Your competition room" : "Start a competition"}</h2></div>{room && <span className={`room-status ${room.status}`}>{room.status}</span>}</div>
        {!room ? <div className="room-create"><label>Display name<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} /></label><button className="competition-primary full" disabled={isBusy("create-room")} onClick={() => run("create-room", async () => { const next = await createRoom(displayName); setRoom(next); setPlayers([{ room_id: next.id, user_id: user.id, display_name: displayName.trim(), ready: false, connected: true, joined_at: new Date().toISOString() }]); }, "Room created. Share the code with your friend.")}>{isBusy("create-room") ? "Creating room…" : "Create friend room"}</button><div className="join-divider"><span>or join a room</span></div><div className="join-row"><input value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} placeholder="6-character code" maxLength={6} /><button className="competition-secondary" disabled={isBusy("join-room") || roomCode.length !== 6} onClick={() => run("join-room", async () => { const found = await findRoomByCode(roomCode); if (!found) throw new Error("Room not found. Check the code and try again."); const player = await joinRoom(found, displayName); setRoom(found); setPlayers((current) => current.some((item) => item.user_id === player.user_id) ? current.map((item) => item.user_id === player.user_id ? player : item) : [...current, player]); void refreshRoom(found.id).catch(() => undefined); }, "Joined the room.")}>{isBusy("join-room") ? "Joining…" : "Join"}</button></div></div> : <div><div className="room-code"><span>ROOM CODE</span><strong>{room.code}</strong><small>Share this code with your friend</small></div><div className="player-list">{players.map((player) => <div className="player-row" key={player.user_id}><span className={`presence ${player.connected ? "online" : ""}`} /><div><strong>{player.display_name}{player.user_id === room.host_id ? " · Host" : ""}</strong><small>{player.ready ? "Ready" : "Waiting"}</small></div><span className={player.ready ? "ready" : "waiting"}>{player.ready ? "READY" : "WAITING"}</span></div>)}</div>{room.status === "lobby" && <div className="room-actions"><button className="competition-secondary" disabled={isBusy("ready")} onClick={() => run("ready", async () => { const next = await setReady(room.id, !Boolean(me?.ready)); if (next) setPlayers((current) => current.map((player) => player.user_id === user.id ? { ...player, ready: next.ready } : player)); })}>{isBusy("ready") ? "Saving…" : me?.ready ? "I'm not ready" : "I'm ready"}</button>{room.host_id === user.id && <button className="competition-primary" disabled={isBusy("start") || !everyoneReady} onClick={() => run("start", async () => { const next = await startRoom(room.id); setRoom(next); }, "Competition started!")}>{isBusy("start") ? "Starting…" : "Start competition"}</button>}</div>}{room.status === "active" && <div className="active-round"><span>ROUND {room.current_round} / {room.duration_rounds}</span><h3>Choose your strategy</h3><div className="decision-options">{[["balanced_growth","Balanced growth","Protect cash while building sustainable demand."],["aggressive_growth","Aggressive growth","Trade margin and cash for faster expansion."],["defensive_cash","Defensive cash","Prioritise liquidity and resilience."]].map(([id,title,desc]) => <button type="button" key={id} className={decision === id ? "selected" : ""} onClick={() => setDecision(id)} disabled={isBusy("submit-decision")}><strong>{title}</strong><span>{desc}</span></button>)}</div><button className="competition-primary full" disabled={isBusy("submit-decision")} onClick={() => run("submit-decision", async () => { const result = await submitDecision(room.id, room.current_round, decision); setRoom((current) => current ? { ...current, current_round: result.current_round, status: result.completed ? "completed" : current.status } : current); }, "Decision submitted. Waiting for the other founders…")}>{isBusy("submit-decision") ? "Submitting…" : "Submit round decision →"}</button></div>}{room.status === "completed" && <div className="completed"><strong>Competition complete.</strong><span>Your final result will appear on the leaderboard after scoring.</span></div>}</div>}
      </section>

      <section className="competition-card leaderboard-card"><div className="card-top"><div><span className="competition-kicker">02 · RANKINGS</span><h2>Leaderboard</h2></div><span className="live-badge">● LIVE</span></div><div className="scope-tabs">{(["global","friends","weekly","monthly"] as Scope[]).map((item) => <button key={item} className={scope === item ? "active" : ""} onClick={() => setScope(item)}>{item}</button>)}</div><div className="leaderboard">{leaderboard.length ? leaderboard.map((row,index) => <div className={`leader-row ${row.user_id===user.id?"self":""}`} key={`${row.user_id}-${row.achieved_at}-${index}`}><strong className="rank">{index+1}</strong><div className="leader-avatar">{(row.display_name ?? "F").slice(0,1).toUpperCase()}</div><div className="leader-name"><strong>{row.display_name ?? "Founder"}{row.user_id===user.id?" · You":""}</strong><small>{row.metrics?.scenario?String(row.metrics.scenario):"Enterprise competition"}</small></div><strong className="score">{money(Number(row.score))}</strong></div>) : <div className="empty-state">No scores yet. Finish a competition to claim first place.</div>}</div></section>

      <section className="competition-card friends-card"><div className="card-top"><div><span className="competition-kicker">03 · NETWORK</span><h2>Friends</h2></div><span>{acceptedFriends.length} accepted</span></div><div className="friend-add"><input value={friendQuery} onChange={(e) => setFriendQuery(e.target.value)} placeholder="Search name or exact email" aria-label="Search friends" /><span className="friend-hint">Type at least 2 characters</span></div>{friendResults.length>0 && <div className="friend-search-results">{friendResults.map((person) => { const addKey = `friend:${person.user_id}`; return <div className="friend-search-row" key={person.user_id}><div><strong>{person.display_name}</strong><small>{person.email ?? "EnterpriseVerse founder"}</small></div><button className="competition-secondary" disabled={isBusy(addKey)} onClick={() => run(addKey, async () => { const friendshipId = await sendFriendRequest(person.user_id); setFriendQuery(""); setFriendResults([]); setFriends((current) => [{ id: friendshipId, requester_id: user.id, addressee_id: person.user_id, status: "pending", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...current]); }, "Friend request sent instantly. The recipient will see it in their requests.")}>{isBusy(addKey) ? "Sending…" : "Add friend"}</button></div>; })}</div>}{acceptedFriends.length ? <div className="friend-list">{acceptedFriends.map((friend) => <div className="friend-row" key={friend.id}><div><strong>Connected founder</strong><small>Friends since {new Date(friend.updated_at).toLocaleDateString()}</small></div><span className="status-accepted">FRIENDS</span></div>)}</div> : <div className="empty-state">Search for a founder by display name or exact email to add them.</div>}</section>
    </div>
    {(message||error)&&<div className={error?"toast error":"toast success"} role={error?"alert":"status"}>{error||message}</div>}
  </main>;
}
