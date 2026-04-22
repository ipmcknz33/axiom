"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.ok = ok;
exports.fail = fail;
exports.failFromError = failFromError;
const server_1 = require("next/server");
class ApiError extends Error {
    code;
    status;
    expose;
    constructor(options) {
        super(options.message);
        this.code = options.code;
        this.status = options.status;
        this.expose = options.expose ?? options.status < 500;
    }
}
exports.ApiError = ApiError;
function ok(data, init) {
    return server_1.NextResponse.json({ data, error: null }, { ...init, status: init?.status ?? 200 });
}
function fail(message, status = 400, code) {
    return server_1.NextResponse.json({
        data: null,
        error: {
            code: code ?? (status >= 500 ? "request_failed" : "request_invalid"),
            message,
        },
    }, { status });
}
function failFromError(error) {
    if (error instanceof ApiError) {
        if (error.status >= 500 || !error.expose) {
            return fail("request failed", error.status, error.code);
        }
        return fail(error.message, error.status, error.code);
    }
    return fail("request failed", 500, "request_failed");
}
