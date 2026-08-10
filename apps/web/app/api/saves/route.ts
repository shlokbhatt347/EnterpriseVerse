import { NextResponse } from "next/server";
import { readSessionCookies } from "../auth/_session";
import { getUser, upsertTable, selectTable, deleteTable } from "../../lib/supabase-rest";

async function authenticatedUser() {
  const { accessToken } = await readSessionCookies();
  if (!accessToken) return null;
  try { return { token: accessToken, user: await getUser(accessToken) }; } catch { return null; }
}

export async function GET(request: Request) {
  const auth = await authenticatedUser();
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const key = new URL(request.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Save key is required." }, { status: 400 });
  try {
    const rows = await selectTable<Array<{ save_key: string; payload: unknown; updated_at: string }>>("business_saves", `select=save_key,payload,updated_at&user_id=eq.${encodeURIComponent(auth.user.id)}&save_key=eq.${encodeURIComponent(key)}&limit=1`, auth.token);
    return NextResponse.json({ save: rows[0] ?? null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load cloud save." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await authenticatedUser();
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const body = await request.json() as { key?: unknown; payload?: unknown };
    const key = typeof body.key === "string" ? body.key.trim().slice(0, 160) : "";
    if (!key) return NextResponse.json({ error: "Save key is required." }, { status: 400 });
    const rows = await upsertTable<Array<{ save_key: string; payload: unknown; updated_at: string }>>("business_saves", { user_id: auth.user.id, save_key: key, payload: body.payload ?? null, updated_at: new Date().toISOString() }, auth.token, "user_id,save_key");
    return NextResponse.json({ save: rows[0] ?? null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save to the cloud." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticatedUser();
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const key = new URL(request.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Save key is required." }, { status: 400 });
  try {
    await deleteTable("business_saves", `user_id=eq.${encodeURIComponent(auth.user.id)}&save_key=eq.${encodeURIComponent(key)}`, auth.token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete cloud save." }, { status: 500 });
  }
}
