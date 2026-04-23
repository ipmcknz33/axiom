import type { NextRequest, NextResponse } from "next/server";

export const AXIOM_ACCESS_TOKEN_COOKIE = "axiom_access_token";
export const AXIOM_REFRESH_TOKEN_COOKIE = "axiom_refresh_token";

export type SessionTokens = {
  accessToken: string;
  expiresAt?: number;
  refreshToken?: string;
};

function commonCookieOptions() {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function setSessionCookies(
  response: NextResponse,
  tokens: SessionTokens,
) {
  const accessMaxAge = tokens.expiresAt
    ? Math.max(60, tokens.expiresAt - Math.floor(Date.now() / 1000))
    : 60 * 30;

  response.cookies.set(AXIOM_ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...commonCookieOptions(),
    maxAge: accessMaxAge,
  });

  if (tokens.refreshToken) {
    response.cookies.set(AXIOM_REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...commonCookieOptions(),
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.delete(AXIOM_ACCESS_TOKEN_COOKIE);
  response.cookies.delete(AXIOM_REFRESH_TOKEN_COOKIE);
}

function readCookieFromHeader(
  request: NextRequest | Request,
  name: string,
): string | null {
  const headers: Headers = (request as Request).headers;
  const cookieHeader = headers.get("cookie") ?? "";
  const pair = cookieHeader
    .split(";")
    .map((part: string) => part.trim())
    .find((part: string) => part.startsWith(`${name}=`));

  return pair ? pair.slice(name.length + 1) : null;
}

export function getAccessTokenFromRequest(request: NextRequest | Request) {
  if ("cookies" in request && request.cookies?.get) {
    return request.cookies.get(AXIOM_ACCESS_TOKEN_COOKIE)?.value ?? null;
  }

  return readCookieFromHeader(request, AXIOM_ACCESS_TOKEN_COOKIE);
}

export function getRefreshTokenFromRequest(request: NextRequest | Request) {
  if ("cookies" in request && request.cookies?.get) {
    return request.cookies.get(AXIOM_REFRESH_TOKEN_COOKIE)?.value ?? null;
  }

  return readCookieFromHeader(request, AXIOM_REFRESH_TOKEN_COOKIE);
}
