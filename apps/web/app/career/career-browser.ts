"use client";

type Session = { access_token: string };
export type CareerProfile = { progress: { xp: number; level: number; skills: Record<string, number>; milestones: unknown[]; reputation: number; market_value: number; career_summary: Record<string, unknown> }; profile: { user_id: string; display_name: string; current_business_id: string | null; active_role: string | null; preferred_role: string | null }; history: Array<{ id: string; business_id: string | null; company_name: string; role: string; started_at: string; ended_at: string | null; performance_score: number; summary: string }>; offers: Array<{ id: string; business_id: string; role: string; compensation: number; reason: string; status: string; created_at: string; company: { id: string; name: string; industry: string | null; stage: string; company_level: number } }> };
export type Candidate = { user_id: string; display_name: string; current_company_name: string | null; current_company_level: number | null; career_level: number; experience_points: number; reputation: number; role_fit: number; skills: Record<string, number> };
export type OpenPosition = { id: string; business_id: string; role: string; title: string; description: string; minimum_experience: number; minimum_reputation: number; minimum_skill: number; compensation: number; status: string };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SESSION_KEY = "enterpriseverse:supabase-session:v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function session(): Session | null {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(SESSION_KEY) : null;
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function uuid(value: string) {
  const normalized = value.trim();
  if (!UUID_RE.test(normalized)) throw new Error("Invalid ID.");
  return normalized;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const current = session();
  if (!url || !anonKey || !current?.access_token) throw new Error("Sign in to continue.");

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  const headers = new Headers(init.headers);
  headers.set("apikey", anonKey);
  headers.set("Authorization", `Bearer ${current.access_token}`);
  headers.set("Content-Type", "application/json");

  try {
    const response = await fetch(`${url}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
    const raw = await response.text();
    let body: unknown = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = raw;
    }

    if (!response.ok) {
      throw new Error(
        typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
          ? body.message
          : `Career request failed (${response.status}).`,
      );
    }

    return body as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The career request took too long. Please try again.");
    }
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Unable to reach the career service. Check your connection and try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function loadCareerProfile() {
  return request<CareerProfile | null>("/rest/v1/rpc/get_career_profile", {
    method: "POST",
    body: "{}",
  });
}

export function searchRecruitablePlayers(businessId: string, role: string, query: string) {
  return request<Candidate[]>("/rest/v1/rpc/search_recruitable_players", {
    method: "POST",
    body: JSON.stringify({
      p_business_id: uuid(businessId),
      p_role: role,
      p_query: query.trim(),
    }),
  });
}

export function createRecruitmentOffer(args: {
  businessId: string;
  candidateId: string;
  positionId: string;
  compensation: number;
  reason: string;
}) {
  if (!Number.isFinite(args.compensation) || args.compensation < 0) {
    throw new Error("Compensation must be a valid non-negative number.");
  }

  const reason = args.reason.trim();
  if (reason.length < 3 || reason.length > 500) {
    throw new Error("Recruitment reason must be between 3 and 500 characters.");
  }

  return request<string>("/rest/v1/rpc/create_recruitment_offer", {
    method: "POST",
    body: JSON.stringify({
      p_business_id: uuid(args.businessId),
      p_candidate_id: uuid(args.candidateId),
      p_position_id: uuid(args.positionId),
      p_compensation: args.compensation,
      p_reason: reason,
    }),
  });
}

export function respondRecruitmentOffer(offerId: string, action: "accept" | "decline") {
  return request<string>("/rest/v1/rpc/respond_recruitment_offer", {
    method: "POST",
    body: JSON.stringify({ p_offer_id: uuid(offerId), p_action: action }),
  });
}

export function listOpenPositions(businessId: string) {
  return request<OpenPosition[]>(
    `/rest/v1/business_open_positions?select=id,business_id,role,title,description,minimum_experience,minimum_reputation,minimum_skill,compensation,status&business_id=eq.${encodeURIComponent(uuid(businessId))}&status=eq.open&order=role.asc`,
  );
}

export function loadNotificationCenter() {
  return request<{
    notifications: Array<{
      id: string;
      type: string;
      title: string;
      body: string;
      read_at: string | null;
      metadata: Record<string, unknown>;
      created_at: string;
    }>;
    unread_count: number;
  }>("/rest/v1/rpc/get_notification_center", {
    method: "POST",
    body: "{}",
  });
}

export function markNotificationCenterRead(notificationId: string) {
  return request<boolean>("/rest/v1/rpc/mark_notification_center_read", {
    method: "POST",
    body: JSON.stringify({ p_notification_id: uuid(notificationId) }),
  });
}
