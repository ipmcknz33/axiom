"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AXIOM_REFRESH_TOKEN_COOKIE = exports.AXIOM_ACCESS_TOKEN_COOKIE = void 0;
exports.setSessionCookies = setSessionCookies;
exports.clearSessionCookies = clearSessionCookies;
exports.getAccessTokenFromRequest = getAccessTokenFromRequest;
exports.getRefreshTokenFromRequest = getRefreshTokenFromRequest;
exports.AXIOM_ACCESS_TOKEN_COOKIE = "axiom_access_token";
exports.AXIOM_REFRESH_TOKEN_COOKIE = "axiom_refresh_token";
function commonCookieOptions() {
    return {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    };
}
function setSessionCookies(response, tokens) {
    const accessMaxAge = tokens.expiresAt
        ? Math.max(60, tokens.expiresAt - Math.floor(Date.now() / 1000))
        : 60 * 30;
    response.cookies.set(exports.AXIOM_ACCESS_TOKEN_COOKIE, tokens.accessToken, {
        ...commonCookieOptions(),
        maxAge: accessMaxAge,
    });
    if (tokens.refreshToken) {
        response.cookies.set(exports.AXIOM_REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
            ...commonCookieOptions(),
            maxAge: 60 * 60 * 24 * 30,
        });
    }
}
function clearSessionCookies(response) {
    response.cookies.delete(exports.AXIOM_ACCESS_TOKEN_COOKIE);
    response.cookies.delete(exports.AXIOM_REFRESH_TOKEN_COOKIE);
}
function getAccessTokenFromRequest(request) {
    if ("cookies" in request && request.cookies?.get) {
        return request.cookies.get(exports.AXIOM_ACCESS_TOKEN_COOKIE)?.value ?? null;
    }
    const cookieHeader = request.headers.get("cookie") ?? "";
    const pair = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${exports.AXIOM_ACCESS_TOKEN_COOKIE}=`));
    return pair ? pair.slice(exports.AXIOM_ACCESS_TOKEN_COOKIE.length + 1) : null;
}
function getRefreshTokenFromRequest(request) {
    if ("cookies" in request && request.cookies?.get) {
        return request.cookies.get(exports.AXIOM_REFRESH_TOKEN_COOKIE)?.value ?? null;
    }
    const cookieHeader = request.headers.get("cookie") ?? "";
    const pair = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${exports.AXIOM_REFRESH_TOKEN_COOKIE}=`));
    return pair ? pair.slice(exports.AXIOM_REFRESH_TOKEN_COOKIE.length + 1) : null;
}
