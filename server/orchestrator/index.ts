export type OrchestratorInput = {
  conversationId: string;
  message: string;
  requestedAction?: string;
  userId: string;
};

export type ValidationSuccess<T> = {
  success: true;
  data: T;
};

export type ValidationFailure = {
  success: false;
  errors: string[];
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

export function validateOrchestratorInput(
  input: unknown,
): ValidationResult<OrchestratorInput> {
  if (!isRecord(input)) {
    return { success: false, errors: ["Input must be an object."] };
  }

  const conversationId = input.conversationId;
  const message = input.message;
  const requestedAction = input.requestedAction;
  const userId = input.userId;

  const errors: string[] = [];

  if (!isUuid(conversationId)) {
    errors.push("conversationId must be a valid UUID.");
  }

  if (!isNonEmptyString(message)) {
    errors.push("message must be a non-empty string.");
  }

  if (requestedAction !== undefined && !isNonEmptyString(requestedAction)) {
    errors.push("requestedAction must be a non-empty string when provided.");
  }

  if (!isUuid(userId)) {
    errors.push("userId must be a valid UUID.");
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      conversationId: conversationId as string,
      message: message as string,
      requestedAction: requestedAction as string | undefined,
      userId: userId as string,
    },
  };
}
