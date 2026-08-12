"use client";

type Session = { access_token: string };

type RealtimeChange = {
  topic: string;
  event: string;
  payload?: { data?: unknown };
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SESSION_KEY = "enterpriseverse:supabase-session:v1";

function readSession(): Session | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function websocketUrl() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const parsed = new URL(SUPABASE_URL);
  parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}/realtime/v1/websocket`;
  parsed.searchParams.set("apikey", SUPABASE_ANON_KEY);
  parsed.searchParams.set("vsn", "1.0.0");
  return parsed.toString();
}

function createRealtimeSubscription(config: {
  topic: string;
  postgresChanges: Array<{ event: "*"; schema: "public"; table: string; filter?: string }>;
  onChange: (change: RealtimeChange) => void;
}) {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let heartbeatTimer: number | null = null;
  let stopped = false;
  let reconnectAttempt = 0;
  let ref = 0;

  const clearTimers = () => {
    if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
    if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
    reconnectTimer = null;
    heartbeatTimer = null;
  };

  const scheduleReconnect = () => {
    if (stopped || reconnectTimer !== null) return;
    const delay = Math.min(30_000, 1_000 * 2 ** reconnectAttempt);
    reconnectAttempt = Math.min(reconnectAttempt + 1, 5);
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  };

  const connect = () => {
    if (stopped || socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
    const endpoint = websocketUrl();
    const session = readSession();
    if (!endpoint || !session?.access_token) {
      scheduleReconnect();
      return;
    }

    try {
      socket = new WebSocket(endpoint);
    } catch {
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      reconnectAttempt = 0;
      ref += 1;
      socket?.send(JSON.stringify({
        topic: config.topic,
        event: "phx_join",
        payload: {
          config: {
            broadcast: { self: false },
            presence: { key: "" },
            postgres_changes: config.postgresChanges,
            private: false,
          },
          access_token: session.access_token,
        },
        ref: String(ref),
      }));

      heartbeatTimer = window.setInterval(() => {
        if (socket?.readyState !== WebSocket.OPEN) return;
        ref += 1;
        socket.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(ref) }));
      }, 25_000);
    };

    socket.onmessage = (message) => {
      try {
        const parsed = JSON.parse(String(message.data)) as RealtimeChange;
        if (parsed.event === "postgres_changes") config.onChange(parsed);
      } catch {
        // Ignore malformed protocol frames; the subscription remains alive.
      }
    };

    socket.onclose = () => {
      clearTimers();
      socket = null;
      scheduleReconnect();
    };

    socket.onerror = () => {
      socket?.close();
    };
  };

  const stop = () => {
    stopped = true;
    clearTimers();
    if (socket && socket.readyState !== WebSocket.CLOSED) socket.close();
    socket = null;
  };

  connect();
  return stop;
}

export function subscribeToCompetitionRoom(roomId: string, onChange: () => void) {
  return createRealtimeSubscription({
    topic: `competition-room-${roomId}`,
    postgresChanges: [
      { event: "*", schema: "public", table: "competition_rooms", filter: `id=eq.${roomId}` },
      { event: "*", schema: "public", table: "competition_players", filter: `room_id=eq.${roomId}` },
      { event: "*", schema: "public", table: "competition_submissions", filter: `room_id=eq.${roomId}` },
    ],
    onChange,
  });
}

export function subscribeToFriendInbox(userId: string, onChange: () => void) {
  return createRealtimeSubscription({
    topic: `friend-inbox-${userId}`,
    postgresChanges: [
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
    ],
    onChange,
  });
}
