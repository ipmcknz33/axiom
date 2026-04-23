/**
 * server/config/index.ts
 *
 * Central server-side config layer. All backend services must read config
 * through these getters — never call process.env directly outside lib/env.ts.
 *
 * Public env is in lib/env.ts -> getPublicEnv()
 * Server env (including optional keys) is in lib/env.ts -> getServerEnv()
 */
export { getPublicEnv, getServerEnv } from "@/lib/env";
export { getLlmConfig } from "@/server/llm/config";
export { getObservabilityConfig } from "@/server/observability/config";
