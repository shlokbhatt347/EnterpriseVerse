"use client";

type CompetitionRoom = { id: string; code: string; host_id: string; competition_type: string; status: string; max_players: number; duration_rounds: number; current_round: number; world_seed: number; created_at: string; updated_at: string };
type CompetitionPlayer = { room_id: string; user_id: string; display_name: string; ready: boolean; connected: boolean; joined_at: string };
type Friend = { id: string; requester_id: string; addressee_id: string; status: "pending" | "accepted" | "declined" | "blocked"; created_at: string; updated_at: string };
type Person = { user_id: string; display_name: string; email: string | null };
type FriendRequestNotification = { id: string; type: "friend_request" | "friend_request_response"; title: string; body: string; read_at: string | null; metadata: Record<string, unknown>; created_at: string };
type LeaderboardRow = { user_id: string; scope: string; score: number; rank?: number | null; metrics: Record<string, unknown>; achieved_at: string; profiles?: { display_name: string } | null };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SESSION_KEY = "enterpriseverse:supabase-session:v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) { return UUID_RE.test(value.trim()); }
function assertUuid(value: string, label: string) { const normalized = value.trim(); if (!isUuid(normalized)) throw new Error(`${label} is invalid.`); return normalized; }

type StoredSession = { access_token: string; refresh_token: string; expires_at?: number; expires_in: number; user: { id: string } };
function session(): StoredSession | null { try { const raw = window.localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) as StoredSession : null; } catch { return null; } }
function requireSession() { const value = session(); if (!url || !anonKey) throw new Error("Cloud services are not configured."); if (!value?.access_token || !isUuid(value.user.id)) throw new Error("Sign in with email to continue."); return value; }

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const current = requireSession();
  const endpoint = `${url}${path}`;
  const headers = new Headers(init.headers);
  headers.set("apikey", anonKey);
  headers.set("Authorization", `Bearer ${current.access_token}`);
  headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(endpoint, { ...init, headers, cache: "no-store" });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Network request failed";
    throw new Error(`Unable to reach the cloud service. Check your connection and try again. (${detail})`);
  }

  const raw = await response.text();
  let body: unknown = null;
  try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }

  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "message" in body && typeof body.message === "string" ? body.message :
      typeof body === "object" && body !== null && "details" in body && typeof body.details === "string" ? body.details :
      typeof body === "object" && body !== null && "hint" in body && typeof body.hint === "string" ? body.hint :
      `Cloud request failed (${response.status}).`;
    throw new Error(message);
  }

  return body as T;
}

export function randomCode() { const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let code = ""; for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)]; return code; }
export function randomSeed() { return Math.floor(Math.random() * 0x7fffffff); }

export async function createRoom(displayName: string, durationRounds = 30) {
  const normalized = displayName.trim();
  if (!normalized) throw new Error("Display name is required.");
  if (normalized.length > 80) throw new Error("Display name is too long.");
  if (!Number.isInteger(durationRounds) || durationRounds < 5 || durationRounds > 90) {
    throw new Error("Competition length must be between 5 and 90 rounds.");
  }

  const result = await rest<CompetitionRoom | CompetitionRoom[]>(
    "/rest/v1/rpc/create_competition_room",
    {
      method: "POST",
      body: JSON.stringify({
        p_display_name: normalized,
        p_duration_rounds: durationRounds,
      }),
    },
  );

  const room = Array.isArray(result) ? result[0] : result;
  if (!room || !isUuid(room.id) || !room.code) {
    throw new Error("Room creation completed but the server returned an invalid room.");
  }

  return room;
}

export async function findRoomByCode(code:string){const normalized=code.trim().toUpperCase();if(!/^[A-Z0-9]{6}$/.test(normalized))throw new Error("Enter the 6-character room code.");const rows=await rest<CompetitionRoom[]>(`/rest/v1/competition_rooms?select=*&code=eq.${encodeURIComponent(normalized)}&limit=1`);return rows[0]??null;}
export async function loadRoom(roomId:string){const id=assertUuid(roomId,"Room ID");const [rooms,players]=await Promise.all([rest<CompetitionRoom[]>(`/rest/v1/competition_rooms?select=*&id=eq.${encodeURIComponent(id)}&limit=1`),rest<CompetitionPlayer[]>(`/rest/v1/competition_players?select=*&room_id=eq.${encodeURIComponent(id)}&order=joined_at.asc`)]);return{room:rooms[0]??null,players};}
export async function joinRoom(room:CompetitionRoom,displayName:string){const current=requireSession();assertUuid(room.id,"Room ID");if(room.status!=="lobby")throw new Error("This competition has already started.");await rest("/rest/v1/competition_players?on_conflict=room_id,user_id",{method:"POST",headers:{Prefer:"resolution=ignore-duplicates,return=minimal"},body:JSON.stringify({room_id:room.id,user_id:current.user.id,display_name:displayName.trim(),ready:false,connected:true})});}
export async function setReady(roomId:string,ready:boolean){const current=requireSession();const id=assertUuid(roomId,"Room ID");await rest(`/rest/v1/competition_players?room_id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(current.user.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({ready,connected:true})});}
export async function startRoom(roomId:string){const current=requireSession();const id=assertUuid(roomId,"Room ID");const players=await rest<CompetitionPlayer[]>(`/rest/v1/competition_players?select=*&room_id=eq.${encodeURIComponent(id)}`);if(players.length<2||players.some(player=>!player.ready))throw new Error("At least two ready players are required.");await rest(`/rest/v1/competition_rooms?id=eq.${encodeURIComponent(id)}&host_id=eq.${encodeURIComponent(current.user.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"active"})});}
export async function submitDecision(roomId:string,round:number,decisionId:string){const id=assertUuid(roomId,"Room ID");if(!Number.isInteger(round)||round<1)throw new Error("Round is invalid.");if(!decisionId.trim()||decisionId.length>120)throw new Error("Decision is invalid.");return rest<{submitted:number;players:number;round_resolved:boolean;completed:boolean;current_round:number}>("/rest/v1/rpc/phase22_submit_decision",{method:"POST",body:JSON.stringify({p_room_id:id,p_round:round,p_decision_id:decisionId.trim()})});}
export async function searchPeople(query:string):Promise<Person[]>{const normalized=query.trim();if(normalized.length<2)return[];return rest<Person[]>("/rest/v1/rpc/search_people",{method:"POST",body:JSON.stringify({p_query:normalized})});}
export async function listFriends(){const current=requireSession();return rest<Friend[]>(`/rest/v1/friendships?select=*&or=(requester_id.eq.${encodeURIComponent(current.user.id)},addressee_id.eq.${encodeURIComponent(current.user.id)})&order=updated_at.desc`);}
export async function sendFriendRequest(userId:string){const target=assertUuid(userId,"Friend ID");return rest<string>("/rest/v1/rpc/send_friend_request",{method:"POST",body:JSON.stringify({p_addressee_id:target})});}
export async function respondFriendRequest(friendshipId:string,action:"accepted"|"declined"){const id=assertUuid(friendshipId,"Friend request ID");return rest<string>("/rest/v1/rpc/respond_friend_request",{method:"POST",body:JSON.stringify({p_friendship_id:id,p_action:action})});}
export async function listFriendNotifications(){return rest<FriendRequestNotification[]>("/rest/v1/notifications?select=id,type,title,body,read_at,metadata,created_at&order=created_at.desc&limit=50");}
export async function markNotificationRead(notificationId:string){const id=assertUuid(notificationId,"Notification ID");return rest<string>("/rest/v1/rpc/mark_notification_read",{method:"POST",body:JSON.stringify({p_notification_id:id})});}
export async function loadLeaderboard(scope:"global"|"friends"|"weekly"|"monthly"){const current=requireSession();const rows=await rest<LeaderboardRow[]>(`/rest/v1/leaderboard_scores?select=user_id,scope,score,rank,metrics,achieved_at,profiles(display_name)&scope=eq.${scope}&order=score.desc,achieved_at.asc&limit=50`);if(scope!=="friends")return rows;const friends=await listFriends();const ids=new Set([current.user.id,...friends.filter(f=>f.status==="accepted").map(f=>f.requester_id===current.user.id?f.addressee_id:f.requester_id)]);return rows.filter(row=>ids.has(row.user_id));}
export async function createEnterprise(name:string,industry:string,teamSize:"solo"|"pair"|"trio"|"company"){if(!name.trim())throw new Error("Enterprise name is required.");return rest<string>("/rest/v1/rpc/create_enterprise",{method:"POST",body:JSON.stringify({p_name:name.trim(),p_industry:industry.trim(),p_team_size:teamSize,p_metadata:{}})});}
export async function sendEnterpriseInvitation(businessId:string,inviteeId:string){const business=assertUuid(businessId,"Enterprise ID");const invitee=assertUuid(inviteeId,"Invitee ID");return rest<string>("/rest/v1/rpc/send_business_invitation",{method:"POST",body:JSON.stringify({p_business_id:business,p_invitee_id:invitee})});}
export async function acceptEnterpriseInvitation(invitationId:string){const invitation=assertUuid(invitationId,"Invitation ID");return rest<string>("/rest/v1/rpc/accept_business_invitation",{method:"POST",body:JSON.stringify({p_invitation_id:invitation})});}
export async function listEnterpriseInvitations(){return rest<Array<{id:string;business_id:string;inviter_id:string;invitee_id:string;status:string;created_at:string}>>("/rest/v1/business_invitations?select=*&order=created_at.desc&limit=50");}
export type{CompetitionRoom,CompetitionPlayer,Friend,Person,FriendRequestNotification,LeaderboardRow};
