"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicEnv = getPublicEnv;
exports.getServerEnv = getServerEnv;
let publicEnvCache;
let serverEnvCache;
const ALLOWED_APP_ENVS = [
    "development",
    "staging",
    "production",
];
function parseAppEnv(raw) {
    if (!raw) {
        return "development";
    }
    if (ALLOWED_APP_ENVS.includes(raw)) {
        return raw;
    }
    throw new Error(`Invalid NEXT_PUBLIC_APP_ENV value: ${raw}. Expected one of ${ALLOWED_APP_ENVS.join(", ")}.`);
}
function requireString(name, raw) {
    if (!raw || raw.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return raw;
}
function requireUrl(name, raw) {
    const value = requireString(name, raw);
    try {
        new URL(value);
        return value;
    }
    catch {
        throw new Error(`Environment variable ${name} must be a valid URL.`);
    }
}
function getPublicEnv() {
    if (!publicEnvCache) {
        publicEnvCache = {
            NEXT_PUBLIC_APP_ENV: parseAppEnv(process.env.NEXT_PUBLIC_APP_ENV),
            NEXT_PUBLIC_SUPABASE_URL: requireUrl("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
            NEXT_PUBLIC_SUPABASE_ANON_KEY: requireString("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        };
    }
    return publicEnvCache;
}
function getServerEnv() {
    if (!serverEnvCache) {
        serverEnvCache = {
            ...getPublicEnv(),
            SUPABASE_SERVICE_ROLE_KEY: requireString("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
            DATABASE_URL: requireString("DATABASE_URL", process.env.DATABASE_URL),
        };
    }
    return serverEnvCache;
}
