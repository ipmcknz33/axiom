import { ok } from "@/lib/api/response";
import { getAccessTokenFromRequest } from "@/server/auth/session";
import { verifyAccessToken } from "@/server/auth/verify";

export async function GET(request: Request) {
  const accessToken = getAccessTokenFromRequest(request);

  if (!accessToken) {
    return ok({ authenticated: false });
  }

  const user = await verifyAccessToken(accessToken);

  if (!user) {
    return ok({ authenticated: false });
  }

  return ok({
    authenticated: true,
    user,
  });
}
