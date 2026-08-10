import { NextResponse } from "next/server";
import { readSessionCookies } from "../auth/_session";
import { getUser, selectTable, upsertTable } from "../../lib/supabase-rest";

async function auth() {
  const { accessToken } = await readSessionCookies();
  if (!accessToken) return null;
  try { return { token: accessToken, user: await getUser(accessToken) }; } catch { return null; }
}

export async function GET() {
  const current = await auth();
  if (!current) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const rows = await selectTable<Array<{ user_id: string; display_name: string; avatar_url: string | null; created_at: string; updated_at: string }>>("profiles", `select=user_id,display_name,avatar_url,created_at,updated_at&user_id=eq.${encodeURIComponent(current.user.id)}&limit=1`, current.token);
    return NextResponse.json({ profile: rows[0] ?? { user_id: current.user.id, display_name: typeof current.user.user_metadata?.display_name === "string" ? current.user.user_metadata.display_name : "Founder", avatar_url: null } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load profile." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const current = await auth();
  if (!current) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const body = await request.json() as { displayName?: unknown; avatarUrl?: unknown };
    const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 60) : "Founder";
    const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim().slice(0, 500) : null;
    const rows = await upsertTable<Array<{ user_id: string; display_name: string; avatar_url: string | null; updated_at: string }>>("profiles", { user_id: current.user.id, display_name: displayName || "Founder", avatar_url: avatarUrl, updated_at: new Date().toISOString() }, current.token, "user_id");
    return NextResponse.json({ profile: rows[0] ?? null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update profile." }, { status: 500 });
  }
}
