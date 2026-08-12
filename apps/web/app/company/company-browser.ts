"use client";

type Session = { access_token: string; user: { id: string } };
export type CompanyRole = "ceo" | "cfo" | "cmo" | "coo" | "cto" | "chro";
export type CompanyMember = { user_id: string; display_name: string; role: CompanyRole | "founder" | "member" | "owner"; joined_at: string };
export type Department = { id: string; business_id: string; department_key: string; name: string; description: string; leader_user_id: string | null };
export type ProposalStep = { id: string; step_order: number; required_role: CompanyRole; status: string; reviewer_id: string | null; note: string | null; acted_at: string | null };
export type BusinessProposal = { id: string; creator_id: string; creator_name: string; department_key: string; proposal_type: string; title: string; description: string; amount: number; expected_impact: Record<string, unknown>; status: string; current_step: number; created_at: string; updated_at: string; steps: ProposalStep[] };
export type CompanyWorkspace = {
  business: { id: string; name: string; industry: string | null; team_size: string; stage: string; metadata: Record<string, unknown> };
  membership: CompanyMember;
  members: CompanyMember[];
  departments: Department[];
  settings: { approval_model: "centralized" | "delegated"; finance_review_threshold: number; ceo_approval_threshold: number } | null;
  proposals: BusinessProposal[];
  events: Array<{ id: string; actor_id: string | null; event_type: string; summary: string; metadata: Record<string, unknown>; created_at: string }>;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SESSION_KEY = "enterpriseverse:supabase-session:v1";
const TIMEOUT_MS = 12_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSession(): Session | null { try { const raw = typeof window !== "undefined" ? window.localStorage.getItem(SESSION_KEY) : null; return raw ? JSON.parse(raw) as Session : null; } catch { return null; } }
function uuid(value: string) { if (!UUID_RE.test(value.trim())) throw new Error("Company ID is invalid."); return value.trim(); }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const current = getSession();
  if (!url || !anonKey || !current?.access_token) throw new Error("Sign in to access your company.");
  const headers = new Headers(init.headers); headers.set("apikey", anonKey); headers.set("Authorization", `Bearer ${current.access_token}`); headers.set("Content-Type", "application/json");
  const controller = new AbortController(); const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${url}${path}`, { ...init, headers, cache: "no-store", signal: controller.signal });
    const raw = await response.text(); let body: unknown = null; try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }
    if (!response.ok) {
      const message = typeof body === "object" && body !== null && "message" in body && typeof body.message === "string" ? body.message : typeof body === "object" && body !== null && "hint" in body && typeof body.hint === "string" ? body.hint : `Company request failed (${response.status}).`;
      throw new Error(message);
    }
    return body as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("The company request took too long. Please try again.");
    if (error instanceof TypeError && error.message === "Failed to fetch") throw new Error("Unable to reach the company service. Check your connection and try again.");
    throw error;
  } finally { window.clearTimeout(timeout); }
}

export async function loadCompanyWorkspace(businessId: string) { return request<CompanyWorkspace>("/rest/v1/rpc/get_company_workspace", { method: "POST", body: JSON.stringify({ p_business_id: uuid(businessId) }) }); }
export async function createProposal(args: { businessId: string; departmentKey: string; proposalType: string; title: string; description: string; amount: number; expectedImpact?: Record<string, unknown> }) {
  if (!args.title.trim()) throw new Error("Proposal title is required.");
  if (!Number.isFinite(args.amount) || args.amount < 0) throw new Error("Proposal amount is invalid.");
  return request<string>("/rest/v1/rpc/create_business_proposal", { method: "POST", body: JSON.stringify({ p_business_id: uuid(args.businessId), p_department_key: args.departmentKey, p_proposal_type: args.proposalType, p_title: args.title.trim(), p_description: args.description.trim(), p_amount: args.amount, p_expected_impact: args.expectedImpact ?? {} }) });
}
export async function reviseProposal(args: { proposalId: string; title: string; description: string; amount: number; expectedImpact?: Record<string, unknown> }) {
  if (!args.title.trim()) throw new Error("Proposal title is required.");
  if (!Number.isFinite(args.amount) || args.amount < 0) throw new Error("Proposal amount is invalid.");
  return request<string>("/rest/v1/rpc/revise_business_proposal", { method: "POST", body: JSON.stringify({ p_proposal_id: uuid(args.proposalId), p_title: args.title.trim(), p_description: args.description.trim(), p_amount: args.amount, p_expected_impact: args.expectedImpact ?? {} }) });
}
export async function actOnProposal(proposalId: string, action: "approve" | "reject" | "request_changes", note = "") { return request<{ proposal_id: string; status: string; current_step: number }>("/rest/v1/rpc/act_on_business_proposal", { method: "POST", body: JSON.stringify({ p_proposal_id: uuid(proposalId), p_action: action, p_note: note.trim() || null }) }); }
