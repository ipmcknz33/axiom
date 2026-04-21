export type AppEnv = "development" | "staging" | "production";

export type PublicEnv = {
  NEXT_PUBLIC_APP_ENV: AppEnv;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
};

export type ServerEnv = PublicEnv & {
  SUPABASE_SERVICE_ROLE_KEY: string;
  DATABASE_URL: string;
};

let publicEnvCache: PublicEnv | undefined;
let serverEnvCache: ServerEnv | undefined;

const ALLOWED_APP_ENVS: readonly AppEnv[] = [
  "development",
  "staging",
  "production",
];

function parseAppEnv(raw: string | undefined): AppEnv {
  if (!raw) {
    return "development";
  }

  if ((ALLOWED_APP_ENVS as readonly string[]).includes(raw)) {
    return raw as AppEnv;
  }

  throw new Error(
    `Invalid NEXT_PUBLIC_APP_ENV value: ${raw}. Expected one of ${ALLOWED_APP_ENVS.join(", ")}.`,
  );
}

function requireString(name: string, raw: string | undefined): string {
  if (!raw || raw.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return raw;
}

function requireUrl(name: string, raw: string | undefined): string {
  const value = requireString(name, raw);

  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL.`);
  }
}

export function getPublicEnv(): PublicEnv {
  if (!publicEnvCache) {
    publicEnvCache = {
      NEXT_PUBLIC_APP_ENV: parseAppEnv(process.env.NEXT_PUBLIC_APP_ENV),
      NEXT_PUBLIC_SUPABASE_URL: requireUrl(
        "NEXT_PUBLIC_SUPABASE_URL",
        process.env.NEXT_PUBLIC_SUPABASE_URL,
      ),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: requireString(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
    };
  }

  return publicEnvCache;
}

export function getServerEnv(): ServerEnv {
  if (!serverEnvCache) {
    serverEnvCache = {
      ...getPublicEnv(),
      SUPABASE_SERVICE_ROLE_KEY: requireString(
        "SUPABASE_SERVICE_ROLE_KEY",
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      ),
      DATABASE_URL: requireString("DATABASE_URL", process.env.DATABASE_URL),
    };
  }

  return serverEnvCache;
}
