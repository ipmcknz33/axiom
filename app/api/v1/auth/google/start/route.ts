import { NextResponse } from "next/server";
import { getGoogleOAuthStartUrl } from "@/server/auth/google";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function GET() {
  try {
    const url = await getGoogleOAuthStartUrl();
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(
      new URL("/signin?error=oauth_start_failed", SITE_URL),
    );
  }
}
