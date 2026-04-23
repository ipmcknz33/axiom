import { fail, failFromError, ok } from "@/lib/api/response";
import { getAuthContext } from "@/server/security/auth";
import { ingestDocuments, type RagDocumentInput } from "@/server/rag/store";

type IngestPayload = {
  documents?: Array<
    RagDocumentInput & {
      text?: string;
    }
  >;
};

export async function POST(request: Request) {
  try {
    const auth = getAuthContext(request.headers);
    if (!auth.success) {
      return fail(auth.error, 401, "unauthenticated");
    }

    const payload = (await request
      .json()
      .catch(() => null)) as IngestPayload | null;
    const documents = payload?.documents;

    if (!Array.isArray(documents) || documents.length === 0) {
      return fail(
        "documents must be a non-empty array.",
        400,
        "invalid_documents",
      );
    }

    const normalizedDocuments = documents.map((doc) => ({
      ...doc,
      content: doc.content ?? doc.text ?? "",
    }));

    const result = await ingestDocuments(normalizedDocuments);

    return ok({
      ...result,
      requestedBy: auth.data.userId,
    });
  } catch (error) {
    return failFromError(error);
  }
}
