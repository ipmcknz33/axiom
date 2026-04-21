declare module "*.css";

declare const process: {
  env: Record<string, string | undefined>;
};

declare module "react" {
  export type ReactNode = any;
}

declare module "@supabase/supabase-js" {
  export type SupabaseResult<T> = Promise<{
    data: T | null;
    error: { message: string } | null;
  }>;

  export interface SupabaseQueryBuilder<T> extends PromiseLike<{
    data: T | null;
    error: { message: string } | null;
  }> {
    eq(column: string, value: string): SupabaseQueryBuilder<T>;
    insert(values: Record<string, unknown>): SupabaseQueryBuilder<T>;
    order(
      column: string,
      options?: { ascending?: boolean },
    ): SupabaseQueryBuilder<T>;
    returns<U>(): SupabaseQueryBuilder<U>;
    select(columns: string): SupabaseQueryBuilder<T>;
    single<U>(): SupabaseResult<U>;
  }

  export interface SupabaseClientLike {
    from(table: string): SupabaseQueryBuilder<unknown[]>;
  }

  export function createClient(url: string, key: string): SupabaseClientLike;
}

declare module "node:test" {
  type TestFn = () => void | Promise<void>;
  type TestOptions = {
    skip?: boolean;
  };
  export default function test(
    name: string,
    fn?: TestFn | null,
    options?: TestOptions,
  ): void;
  export function describe(name: string, fn: () => void | Promise<void>): void;
  export function it(
    name: string,
    fn: TestFn | null,
    options?: TestOptions,
  ): void;
}

declare module "node:assert/strict" {
  const assert: {
    equal(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    strictEqual(actual: unknown, expected: unknown, message?: string): void;
    notEqual(actual: unknown, expected: unknown, message?: string): void;
    throws(fn: () => void, message?: string): void;
    ok(value: unknown, message?: string): void;
  };
  export default assert;
}

declare module "next" {
  export interface Metadata {
    title?: string;
    description?: string;
  }

  export interface NextConfig {
    [key: string]: unknown;
  }
}

declare module "next/server" {
  export interface NextRequest {
    nextUrl: {
      pathname: string;
    };
  }

  export class NextResponse {
    headers: {
      set(name: string, value: string): void;
    };
    static next(): NextResponse;
    static json(body: unknown, init?: { status?: number }): NextResponse;
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: unknown;
  }
}
