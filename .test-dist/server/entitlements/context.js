"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntitlementContext = getEntitlementContext;
const response_1 = require("@/lib/api/response");
const session_1 = require("@/server/auth/session");
const refresh_1 = require("@/server/auth/refresh");
const verify_1 = require("@/server/auth/verify");
const auth_1 = require("@/server/security/auth");
async function getEntitlementContext(request) {
    const accessToken = (0, session_1.getAccessTokenFromRequest)(request);
    const refreshToken = (0, session_1.getRefreshTokenFromRequest)(request);
    let verifiedUser = accessToken ? await (0, verify_1.verifyAccessToken)(accessToken) : null;
    if (!verifiedUser && refreshToken) {
        const refreshed = await (0, refresh_1.refreshSession)(refreshToken);
        if (refreshed) {
            verifiedUser = await (0, verify_1.verifyAccessToken)(refreshed.accessToken);
        }
    }
    if (verifiedUser) {
        return {
            roleHint: request.headers.get("x-axiom-role") ?? undefined,
            userEmail: verifiedUser.email,
            userId: verifiedUser.id,
        };
    }
    const headerAuth = (0, auth_1.getAuthContext)(request.headers);
    if (headerAuth.success) {
        return {
            roleHint: headerAuth.data.role,
            userId: headerAuth.data.userId,
        };
    }
    throw new response_1.ApiError({
        code: "unauthenticated",
        message: "Unauthenticated request.",
        status: 401,
        expose: true,
    });
}
