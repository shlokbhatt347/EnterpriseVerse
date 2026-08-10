import { NextResponse } from "next/server";
import { setSessionCookies } from "../_session";
import { signUpWithEmail } from "../../../lib/supabase-rest";

function validEmail(value: unknown): value is string { return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown; displayName?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 60) : "Founder";
    if (!validEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    const session = await signUpWithEmail(email, password, displayName || "Founder");
    const response = NextResponse.json({ ok: true, requiresVerification: !session.access_token, user: session.user ? { id: session.user.id, email: session.user.email, displayName: session.user.user_metadata?.display_name ?? displayName } : null });
    if (session.access_token) setSessionCookies(response, session);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create your account." }, { status: 400 });
  }
}
