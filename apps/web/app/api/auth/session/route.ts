import { NextResponse } from "next/server";
import { clearSessionCookies, readSessionCookies, setSessionCookies } from "../_session";
import { getUser, refreshSession } from "../../../lib/supabase-rest";

export async function GET() {
  const { accessToken, refreshToken } = await readSessionCookies();
  if (!accessToken && !refreshToken) return NextResponse.json({ user: null, authenticated: false });
  try {
    let token = accessToken;
    let refreshed = false;
    let session: Awaited<ReturnType<typeof refreshSession>> | null = null;
    let user;
    try { user = token ? await getUser(token) : null; } catch {
      if (!refreshToken) throw new Error("Session expired.");
      session = await refreshSession(refreshToken);
      token = session.access_token;
      refreshed = true;
      user = session.user;
    }
    if (!user) throw new Error("Session expired.");
    const response = NextResponse.json({ authenticated: true, user: { id: user.id, email: user.email ?? null, displayName: typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "Founder", emailConfirmed: Boolean(user.email_confirmed_at) } });
    if (refreshed && session) setSessionCookies(response, session);
    return response;
  } catch {
    const response = NextResponse.json({ user: null, authenticated: false });
    clearSessionCookies(response);
    return response;
  }
}
