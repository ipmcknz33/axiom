"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthContext = getAuthContext;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(value) {
    return UUID_REGEX.test(value);
}
function normalizeRole(value) {
    const normalized = value?.trim().toLowerCase();
    if (normalized === "admin" || normalized === "service") {
        return normalized;
    }
    return "user";
}
function getAuthContext(headers) {
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
