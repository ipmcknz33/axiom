import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/server/auth/session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/signin", request.url));
  clearSessionCookies(response);
  return response;
}
