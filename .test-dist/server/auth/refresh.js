"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshSession = refreshSession;
const env_1 = require("@/lib/env");
/**
 * Exchange a Supabase refresh token for a new access + refresh token pair.
 * Uses the Supabase Auth REST endpoint directly so this runs in Edge middleware
 * without requiring a stateful client instance.
 */
async function refreshSession(refreshToken) {
    if (!refreshToken)
        return null;
    const env = (0, env_1.getPublicEnv)();
    let response;
    try {
        response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
            body: JSON.stringify({ refresh_token: refreshToken }),
            headers: {
                "Content-Type": "application/json",
                apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            method: "POST",
        });
    }
    catch {
        return null;
    }
    if (!response.ok)
        return null;
    const data = (await response.json());
    if (!data.access_token || !data.refresh_token)
        return null;
    return {
        accessToken: data.access_token,
        expiresAt: data.expires_at,
        refreshToken: data.refresh_token,
    };
}
