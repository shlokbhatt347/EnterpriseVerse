import { NextResponse } from "next/server";
import { readSessionCookies, setSessionCookies } from "../_session";
import { getUser, signInWithEmail } from "../../../lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    const session = await signInWithEmail(email, password);
    const user = await getUser(session.access_token);
    const response = NextResponse.json({ user: { id: user.id, displayName: typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "Founder", email: user.email ?? email, emailConfirmed: Boolean(user.email_confirmed_at) } });
    setSessionCookies(response, session);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sign in." }, { status: 401 });
  }
}
