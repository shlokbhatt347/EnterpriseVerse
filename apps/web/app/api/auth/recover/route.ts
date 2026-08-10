import { NextResponse } from "next/server";
import { requestPasswordReset } from "../../../lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    await requestPasswordReset(email, `${origin}/auth/reset`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send the reset email." }, { status: 400 });
  }
}
