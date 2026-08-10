import { NextResponse } from "next/server";
import { readSessionCookies } from "../_session";
import { getUser, updatePassword } from "../../../lib/supabase-rest";

export async function POST(request: Request) {
  const { accessToken } = await readSessionCookies();
  if (!accessToken) return NextResponse.json({ error: "Reset link expired. Request a new one." }, { status: 401 });
  try {
    const body = await request.json() as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    await getUser(accessToken);
    await updatePassword(accessToken, password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update password." }, { status: 400 });
  }
}
