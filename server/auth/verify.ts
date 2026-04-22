import { getPublicEnv } from "@/lib/env";

type VerifiedUser = {
  email?: string;
  id: string;
};

export async function verifyAccessToken(
  accessToken: string,
): Promise<VerifiedUser | null> {
  if (!accessToken) {
    return null;
  }

  const env = getPublicEnv();
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

  const data = (await response.json()) as { id?: string; email?: string };

  if (!data.id) {
    return null;
  }

  return {
    email: data.email,
    id: data.id,
  };
}
