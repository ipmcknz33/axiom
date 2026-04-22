declare module "next/server" {
  export interface RequestCookie {
    name: string;
    value: string;
  }

  export interface RequestCookies {
    get(name: string): RequestCookie | undefined;
  }

  export interface NextRequest {
    cookies: RequestCookies;
    nextUrl: {
      pathname: string;
      searchParams: {
        set(name: string, value: string): void;
      };
    };
    url: string;
  }

  export interface ResponseCookies {
    delete(name: string): void;
    set(
      name: string,
      value: string,
      options?: {
        httpOnly?: boolean;
        maxAge?: number;
        path?: string;
        sameSite?: "lax" | "strict" | "none";
        secure?: boolean;
      },
    ): void;
  }

  export class NextResponse {
    cookies: ResponseCookies;
    headers: {
      set(name: string, value: string): void;
    };
    static next(): NextResponse;
    static redirect(url: string | URL): NextResponse;
    static json(body: unknown, init?: { status?: number }): NextResponse;
  }
}

declare module "next/headers" {
  export function cookies(): {
    get(name: string): { name: string; value: string } | undefined;
    set(name: string, value: string): void;
    delete(name: string): void;
  };
}
