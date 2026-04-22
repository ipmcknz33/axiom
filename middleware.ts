import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AXIOM_ACCESS_TOKEN_COOKIE,
  AXIOM_REFRESH_TOKEN_COOKIE,
  setSessionCookies,
} from "@/server/auth/session";
import { verifyAccessToken } from "@/server/auth/verify";
import { refreshSession } from "@/server/auth/refresh";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const accessToken = request.cookies.get(AXIOM_ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(AXIOM_REFRESH_TOKEN_COOKIE)?.value;

  const clearAndRedirectToSignIn = () => {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(signInUrl);
    response.cookies.delete(AXIOM_ACCESS_TOKEN_COOKIE);
    response.cookies.delete(AXIOM_REFRESH_TOKEN_COOKIE);
    return response;
  };

  /** Attempt a refresh exchange and return a passthrough response with updated cookies,
   *  or null if refresh fails (caller should redirect to sign-in). */
  const tryRefresh = async () => {
    if (!refreshToken) return null;
    const refreshed = await refreshSession(refreshToken);
    if (!refreshed) return null;
    const response = NextResponse.next();
    response.headers.set("x-axiom-path", pathname);
    setSessionCookies(response, refreshed);
    return response;
  };

  if (pathname.startsWith("/app")) {
    if (!accessToken) {
      const refreshed = await tryRefresh();
      return refreshed ?? clearAndRedirectToSignIn();
    }

    const verifiedUser = await verifyAccessToken(accessToken);
    if (!verifiedUser) {
      const refreshed = await tryRefresh();
      return refreshed ?? clearAndRedirectToSignIn();
    }
  }

  if (pathname === "/signin" && accessToken) {
    const verifiedUser = await verifyAccessToken(accessToken);
    if (verifiedUser) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-axiom-path", pathname);
  return response;
}

export const config = {
  matcher: ["/", "/signin", "/app/:path*", "/api/:path*"],
};
