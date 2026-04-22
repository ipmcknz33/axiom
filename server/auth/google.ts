import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function createPublicSupabaseClient() {
  const env = getPublicEnv();
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getGoogleOAuthStartUrl() {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    options: {
      redirectTo: `${getSiteUrl()}/api/v1/auth/callback`,
    },
    provider: "google",
  });

  if (error || !data.url) {
    throw new Error(error?.message ?? "Unable to start Google OAuth flow.");
  }

  return data.url;
}

export async function exchangeGoogleCodeForSession(code: string) {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    throw new Error(
      error?.message ?? "Unable to exchange OAuth code for session.",
    );
  }

  return {
    accessToken: data.session.access_token,
    expiresAt: data.session.expires_at,
    refreshToken: data.session.refresh_token,
  };
}
