import { NextResponse } from "next/server";
import { exchangeGoogleCodeForSession } from "@/server/auth/google";
import { setSessionCookies } from "@/server/auth/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/signin?error=missing_code", request.url),
    );
  }

  try {
    const session = await exchangeGoogleCodeForSession(code);
    const response = NextResponse.redirect(new URL("/app", request.url));
    setSessionCookies(response, session);
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/signin?error=oauth_callback_failed", request.url),
    );
  }
}
