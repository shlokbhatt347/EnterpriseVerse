import { NextResponse } from "next/server";
import { setSessionCookies } from "../_session";
import { signInWithEmail } from "../../../lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    const session = await signInWithEmail(email, password);
    const response = NextResponse.json({ ok: true, user: { id: session.user.id, email: session.user.email, displayName: session.user.user_metadata?.display_name ?? "Founder", emailConfirmed: Boolean(session.user.email_confirmed_at) } });
    setSessionCookies(response, session);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sign in.";
    const status = /confirm|credential|password|invalid/i.test(message) ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
