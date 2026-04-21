import { NextResponse } from "next/server";

export class ApiError extends Error {
  code: string;
  status: number;
  expose: boolean;

  constructor(options: {
    code: string;
    message: string;
    status: number;
    expose?: boolean;
  }) {
    super(options.message);
    this.code = options.code;
    this.status = options.status;
    this.expose = options.expose ?? options.status < 500;
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    { data, error: null },
    { ...init, status: init?.status ?? 200 },
  );
}

export function fail(message: string, status = 400, code?: string) {
  return NextResponse.json(
    {
      data: null,
      error: {
        code: code ?? (status >= 500 ? "request_failed" : "request_invalid"),
        message,
      },
    },
    { status },
  );
}

export function failFromError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status >= 500 || !error.expose) {
      return fail("request failed", error.status, error.code);
    }

    return fail(error.message, error.status, error.code);
  }

  return fail("request failed", 500, "request_failed");
}
