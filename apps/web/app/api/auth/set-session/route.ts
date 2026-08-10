import { NextResponse } from "next/server";
import { getUser } from "../../../lib/supabase-rest";
import { setSessionCookies } from "../_session";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { accessToken?: unknown; refreshToken?: unknown; expiresIn?: unknown };
    const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
    const refreshToken = typeof body.refreshToken === "string" ? body.refreshToken : "";
    const expiresIn = typeof body.expiresIn === "number" && Number.isFinite(body.expiresIn) ? body.expiresIn : 3600;
    if (!accessToken || !refreshToken) return NextResponse.json({ error: "Invalid reset session." }, { status: 400 });
    await getUser(accessToken);
    const response = NextResponse.json({ ok: true });
    setSessionCookies(response, { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to establish reset session." }, { status: 400 });
  }
}
