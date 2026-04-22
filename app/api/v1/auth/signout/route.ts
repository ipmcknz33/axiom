import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/server/auth/session";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function POST() {
  const response = NextResponse.redirect(new URL("/signin", SITE_URL));
  clearSessionCookies(response);
  return response;
}
