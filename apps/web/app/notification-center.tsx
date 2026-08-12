"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "./lib/supabase-browser";
import { loadNotificationCenter, markNotificationCenterRead } from "./career/career-browser";
import { subscribeToFriendInbox } from "./competition/realtime";
import "./notification-center.css";

type Notification = { id: string; type: string; title: string; body: string; read_at: string | null; metadata: Record<string, unknown>; created_at: string };
const iconFor = (type: string) => type === "recruitment_offer" ? "↗" : type === "company_invitation" ? "◈" : type === "friend_request" ? "♢" : type === "recruitment_response" ? "✓" : "•";

export default function NotificationCenter() {
  const user = getStoredUser();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  async function refresh() {
    if (!user) return;
    try { const result = await loadNotificationCenter(); setItems(result.notifications); setUnread(result.unread_count); } catch { /* keep the app shell usable */ }
  }

  useEffect(() => {
    if (!user) return;
    void refresh();
    return subscribeToFriendInbox(user.id, () => { void refresh(); });
  }, [user?.id]);

  async function read(item: Notification) {
    if (!item.read_at) {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry));
      setUnread((current) => Math.max(0, current - 1));
      try { await markNotificationCenterRead(item.id); } catch { void refresh(); }
    }
    setOpen(false);
    const target = typeof item.metadata?.offer_id === "string" ? "/career?tab=offers" : typeof item.metadata?.invitation_id === "string" ? "/enterprise?mode=executive" : "/career";
    window.location.assign(target);
  }

  if (!user) return null;
  return <div className="notification-center">
    <button type="button" className={`notification-trigger ${unread ? "has-unread" : ""}`} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} onClick={() => { setOpen((value) => !value); if (!open) void refresh(); }}>
      <span>♧</span>{unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}
    </button>
    {open && <div className="notification-panel" role="dialog" aria-label="Notification center">
      <div className="notification-head"><div><span>INBOX</span><h2>Notifications</h2></div><Link href="/career">Career →</Link></div>
      <div className="notification-list">{items.length ? items.slice(0, 12).map((item) => <button type="button" className={`notification-item ${item.read_at ? "read" : "unread"}`} key={item.id} onClick={() => void read(item)}><span className="notification-icon">{iconFor(item.type)}</span><span><strong>{item.title}</strong><small>{item.body}</small><em>{new Date(item.created_at).toLocaleString()}</em></span></button>) : <div className="notification-empty">You're all caught up.</div>}</div>
      <div className="notification-foot"><Link href="/career?tab=notifications" onClick={() => setOpen(false)}>Open notification dashboard →</Link></div>
    </div>}
  </div>;
}
