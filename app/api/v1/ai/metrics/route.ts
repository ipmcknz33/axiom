import { fail, failFromError, ok } from "@/lib/api/response";
import { getRecentRuns, getTelemetrySummary } from "@/server/ai/telemetry";
import { getRagStats } from "@/server/rag/store";
import { getAuthContext } from "@/server/security/auth";

export async function GET(request: Request) {
  try {
    const auth = getAuthContext(request.headers);
    if (!auth.success) {
      return fail(auth.error, 401, "unauthenticated");
    }

    return ok({
      rag: getRagStats(),
      recentRuns: getRecentRuns(10),
      summary: getTelemetrySummary(),
      viewer: {
        role: auth.data.role,
        userId: auth.data.userId,
      },
    });
  } catch (error) {
    return failFromError(error);
  }
}
