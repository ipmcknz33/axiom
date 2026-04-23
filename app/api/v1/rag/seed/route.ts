import { fail, failFromError, ok } from "@/lib/api/response";
import {
  ensureSeeded,
  getRagStats,
  isSeeded,
  reseedDemoDocuments,
} from "@/server/rag/store";
import { getAuthContext } from "@/server/security/auth";

export async function GET(request: Request) {
  try {
    const auth = getAuthContext(request.headers);
    if (!auth.success) {
      return fail(auth.error, 401, "unauthenticated");
    }

    const status = ensureSeeded();

    return ok({
      ...status,
      rag: getRagStats(),
      seeded: isSeeded(),
      viewer: {
        role: auth.data.role,
        userId: auth.data.userId,
      },
    });
  } catch (error) {
    return failFromError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = getAuthContext(request.headers);
    if (!auth.success) {
      return fail(auth.error, 401, "unauthenticated");
    }

    const status = reseedDemoDocuments();

    return ok({
      ...status,
      rag: getRagStats(),
      seeded: isSeeded(),
      reseededBy: auth.data.userId,
    });
  } catch (error) {
    return failFromError(error);
  }
}
