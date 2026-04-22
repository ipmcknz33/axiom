import { ApiError } from "@/lib/api/response";
import {
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
} from "@/server/auth/session";
import { refreshSession } from "@/server/auth/refresh";
import { verifyAccessToken } from "@/server/auth/verify";
import { getAuthContext } from "@/server/security/auth";

export type EntitlementContext = {
  roleHint?: string;
  userEmail?: string;
  userId: string;
};

export async function getEntitlementContext(
  request: Request,
): Promise<EntitlementContext> {
  const accessToken = getAccessTokenFromRequest(request);
  const refreshToken = getRefreshTokenFromRequest(request);

  let verifiedUser = accessToken ? await verifyAccessToken(accessToken) : null;

  if (!verifiedUser && refreshToken) {
    const refreshed = await refreshSession(refreshToken);
    if (refreshed) {
      verifiedUser = await verifyAccessToken(refreshed.accessToken);
    }
  }

  if (verifiedUser) {
    return {
      roleHint: request.headers.get("x-axiom-role") ?? undefined,
      userEmail: verifiedUser.email,
      userId: verifiedUser.id,
    };
  }

  const headerAuth = getAuthContext(request.headers);
  if (headerAuth.success) {
    return {
      roleHint: headerAuth.data.role,
      userId: headerAuth.data.userId,
    };
  }

  throw new ApiError({
    code: "unauthenticated",
    message: "Unauthenticated request.",
    status: 401,
    expose: true,
  });
}
