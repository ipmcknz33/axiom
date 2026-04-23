import { fail, failFromError, ok } from "@/lib/api/response";
import { runQueryPipeline } from "@/server/ai/orchestrator";
import { getAuthContext } from "@/server/security/auth";

type QueryPayload = {
  query?: string;
  topK?: number;
};

export async function POST(request: Request) {
  try {
    const auth = getAuthContext(request.headers);
    if (!auth.success) {
      return fail(auth.error, 401, "unauthenticated");
    }

    const payload = (await request
      .json()
      .catch(() => null)) as QueryPayload | null;
    const query = payload?.query?.trim();

    if (!query) {
      return fail("query is required.", 400, "invalid_query");
    }

    const result = await runQueryPipeline({
      query,
      role: auth.data.role,
      topK: payload?.topK,
      userId: auth.data.userId,
    });

    return ok(result);
  } catch (error) {
    return failFromError(error);
  }
}
