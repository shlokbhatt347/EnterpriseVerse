import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "ev_access";
export const REFRESH_COOKIE = "ev_refresh";

const baseCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setSessionCookies(response: NextResponse, session: { access_token: string; refresh_token: string; expires_in: number }) {
  response.cookies.set(ACCESS_COOKIE, session.access_token, { ...baseCookie, maxAge: Math.max(60, session.expires_in) });
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, { ...baseCookie, maxAge: 60 * 60 * 24 * 30 });
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { ...baseCookie, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...baseCookie, maxAge: 0 });
}

export async function readSessionCookies() {
  const store = await cookies();
  return { accessToken: store.get(ACCESS_COOKIE)?.value ?? "", refreshToken: store.get(REFRESH_COOKIE)?.value ?? "" };
}
