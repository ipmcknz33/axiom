"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = verifyAccessToken;
const env_1 = require("@/lib/env");
async function verifyAccessToken(accessToken) {
    if (!accessToken) {
        return null;
    }
    const env = (0, env_1.getPublicEnv)();
    const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
        headers: {
            apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
        },
        method: "GET",
    });
    if (!response.ok) {
        return null;
    }
    const data = (await response.json());
    if (!data.id) {
        return null;
    }
    return {
        email: data.email,
        id: data.id,
    };
}
