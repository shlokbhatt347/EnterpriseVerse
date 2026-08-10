import { NextResponse } from "next/server";
import { clearSessionCookies, readSessionCookies, setSessionCookies } from "../_session";
import { getUser, refreshSession } from "../../../lib/supabase-rest";

export async function GET() {
  const { accessToken, refreshToken } = await readSessionCookies();
  if (!accessToken) return NextResponse.json({ authenticated: false, user: null });
  try {
    const user = await getUser(accessToken);
    return NextResponse.json({ authenticated: true, user: { id: user.id, displayName: typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "Founder", email: user.email ?? null, emailConfirmed: Boolean(user.email_confirmed_at) } });
  } catch {
    if (!refreshToken) return NextResponse.json({ authenticated: false, user: null });
    try {
      const session = await refreshSession(refreshToken);
      const user = await getUser(session.access_token);
      const response = NextResponse.json({ authenticated: true, user: { id: user.id, displayName: typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "Founder", email: user.email ?? null, emailConfirmed: Boolean(user.email_confirmed_at) } });
      setSessionCookies(response, session);
      return response;
    } catch {
      const response = NextResponse.json({ authenticated: false, user: null });
      clearSessionCookies(response);
      return response;
    }
  }
}
