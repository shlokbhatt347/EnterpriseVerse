import { NextResponse } from "next/server";
import { setSessionCookies } from "../_session";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { accessToken?: unknown; refreshToken?: unknown; expiresIn?: unknown };
    const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
    const refreshToken = typeof body.refreshToken === "string" ? body.refreshToken : "";
    const expiresIn = typeof body.expiresIn === "number" ? body.expiresIn : 3600;
    if (!accessToken || !refreshToken) return NextResponse.json({ error: "Invalid session." }, { status: 400 });
    const response = NextResponse.json({ ok: true });
    setSessionCookies(response, { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  }
}
