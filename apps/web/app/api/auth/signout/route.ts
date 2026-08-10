import { NextResponse } from "next/server";
import { clearSessionCookies, readSessionCookies } from "../_session";
import { signOutSupabase } from "../../../lib/supabase-rest";

export async function POST() {
  const { accessToken } = await readSessionCookies();
  if (accessToken) {
    try { await signOutSupabase(accessToken); } catch { /* Always clear local session cookies. */ }
  }
  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  return response;
}
