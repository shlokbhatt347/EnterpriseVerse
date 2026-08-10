import { NextResponse } from "next/server";
import { setSessionCookies } from "../_session";
import { signUpWithEmail } from "../../../lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown; displayName?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 60) : "";
    if (!email || !password || !displayName) return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    const session = await signUpWithEmail(email, password, displayName);
    if (!session.access_token) return NextResponse.json({ user: null, requiresVerification: true });
    const response = NextResponse.json({ user: { id: session.user.id, displayName, email: session.user.email ?? email, emailConfirmed: Boolean(session.user.email_confirmed_at) }, requiresVerification: false });
    setSessionCookies(response, session);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create your account." }, { status: 400 });
  }
}
