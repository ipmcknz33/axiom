const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AxiomRole = "admin" | "service" | "user";

export type AuthContext = {
  role: AxiomRole;
  userId: string;
};

export type AuthContextResult =
  | {
      success: true;
      data: AuthContext;
    }
  | {
      success: false;
      error: string;
    };

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function normalizeRole(value: string | null): AxiomRole {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "admin" || normalized === "service") {
    return normalized;
  }

  return "user";
}

export function getAuthContext(headers: Headers): AuthContextResult {
  const userId = headers.get("x-axiom-user-id")?.trim();

  if (!userId) {
    return {
      success: false,
      error: "Missing required x-axiom-user-id header.",
    };
  }

  if (!isUuid(userId)) {
    return {
      success: false,
      error: "x-axiom-user-id must be a valid UUID.",
    };
  }

  return {
    success: true,
    data: {
      role: normalizeRole(headers.get("x-axiom-role")),
      userId,
    },
  };
}
