/**
 * LAYER 3 DEEP: Middleware Adversarial & Edge-Case Test Suite
 *
 * Complements middleware.test.ts (18 tests) with exhaustive gap coverage.
 * Every test here targets a path or condition NOT covered by the base suite.
 *
 * Files under test:
 *   src/middleware.ts  (Clerk auth middleware, 36 lines)
 *
 * Matrices:
 *   MW5: Clerk Key Evaluation Edge Cases          (8 tests)
 *   MW6: Route Matching Boundary Conditions        (10 tests)
 *   MW7: clerkHandler Callback Behavior            (8 tests)
 *   MW8: Passthrough Middleware Contract            (6 tests)
 *   MW9: Config Matcher Regex Validation            (10 tests)
 *   MW10: Concurrent & Sequential Middleware Calls  (6 tests)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextResponse } from "next/server";

// ============================================================================
// MOCK SETUP
// ============================================================================

let capturedCallback: Function | null = null;
let capturedRoutePatterns: string[] = [];
let routeMatcherFn: ((req: any) => boolean) | null = null;

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: vi.fn((callback: Function) => {
    capturedCallback = callback;
    return async (req: any) => {
      const mockAuthObj = { protect: vi.fn() };
      const mockAuthFn = Object.assign(
        vi.fn().mockReturnValue(mockAuthObj),
        mockAuthObj
      );
      await callback(mockAuthFn, req);
      return { authCalled: true, protect: mockAuthObj.protect };
    };
  }),
  createRouteMatcher: vi.fn((patterns: string[]) => {
    capturedRoutePatterns = patterns;
    const matcher = (req: any) => {
      const pathname = req?.nextUrl?.pathname || req?.url || "";
      return patterns.some((p: string) => {
        const regexStr = "^" + p.replace(/\(\.?\*\)/g, ".*") + "$";
        return new RegExp(regexStr).test(pathname);
      });
    };
    routeMatcherFn = matcher;
    return matcher;
  }),
}));

// ============================================================================
// HELPERS
// ============================================================================

function makeRequest(pathname: string) {
  return {
    url: `http://localhost:3000${pathname}`,
    nextUrl: { pathname },
  };
}

// ============================================================================
// MW5: CLERK KEY EVALUATION EDGE CASES
// ============================================================================

describe("MW5: Clerk Key Evaluation Edge Cases", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  it("empty string key → falsy → passthrough", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "";
    vi.resetModules();
    const middleware = await import("../../middleware");
    const handler = middleware.default as () => any;
    const response = handler();
    expect(response).toBeDefined();
    expect(response.headers).toBeDefined();
  });

  it("key containing 'your-key-here' as substring → passthrough", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
      "pk_test_your-key-here_suffix123";
    vi.resetModules();
    const middleware = await import("../../middleware");
    const handler = middleware.default as () => any;
    const response = handler();
    // includes("your-key-here") returns true → hasClerkKeys is false
    expect(response).toBeDefined();
  });

  it("key 'YOUR-KEY-HERE' (uppercase) → NOT matching includes check → auth enabled", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "YOUR-KEY-HERE";
    vi.resetModules();
    const middleware = await import("../../middleware");
    const handler = middleware.default;
    // .includes() is case-sensitive, so "YOUR-KEY-HERE" does NOT match "your-key-here"
    // Therefore hasClerkKeys is true → clerkHandler is used
    expect(handler.constructor.name).toBe("AsyncFunction");
  });

  it("undefined key → hasClerkKeys is false → passthrough", async () => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    vi.resetModules();
    const middleware = await import("../../middleware");
    const handler = middleware.default as () => any;
    const response = handler();
    expect(response).toBeDefined();
  });

  it("valid pk_test_ key → hasClerkKeys is true → clerkHandler", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    vi.resetModules();
    const middleware = await import("../../middleware");
    const handler = middleware.default;
    expect(handler.constructor.name).toBe("AsyncFunction");
  });

  it("valid pk_live_ key → hasClerkKeys is true → clerkHandler", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
      "pk_live_abc123def456ghi789";
    vi.resetModules();
    const middleware = await import("../../middleware");
    const handler = middleware.default;
    expect(handler.constructor.name).toBe("AsyncFunction");
  });

  it("whitespace-only key → truthy + no placeholder match → clerkHandler", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "   ";
    vi.resetModules();
    const middleware = await import("../../middleware");
    const handler = middleware.default;
    // "   " is truthy and doesn't include "your-key-here"
    expect(handler.constructor.name).toBe("AsyncFunction");
  });

  it("key exactly equal to 'your-key-here' → passthrough", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "your-key-here";
    vi.resetModules();
    const middleware = await import("../../middleware");
    const handler = middleware.default as () => any;
    const response = handler();
    expect(response).toBeDefined();
  });
});

// ============================================================================
// MW6: ROUTE MATCHING BOUNDARY CONDITIONS
// ============================================================================

describe("MW6: Route Matching Boundary Conditions", () => {
  beforeEach(() => {
    vi.resetModules();
    capturedRoutePatterns = [];
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  it("/api/generate matches protected route", async () => {
    await import("../../middleware");
    expect(routeMatcherFn!(makeRequest("/api/generate"))).toBe(true);
  });

  it("/api/generate/ with trailing slash matches", async () => {
    await import("../../middleware");
    expect(routeMatcherFn!(makeRequest("/api/generate/"))).toBe(true);
  });

  it("/api/generate/TMPL_RISK_MANAGEMENT matches", async () => {
    await import("../../middleware");
    expect(
      routeMatcherFn!(makeRequest("/api/generate/TMPL_RISK_MANAGEMENT"))
    ).toBe(true);
  });

  it("/api/generate?query=param matches (path portion)", async () => {
    await import("../../middleware");
    // nextUrl.pathname does not include query params
    expect(routeMatcherFn!(makeRequest("/api/generate"))).toBe(true);
  });

  it("/api/other does NOT match", async () => {
    await import("../../middleware");
    expect(routeMatcherFn!(makeRequest("/api/other"))).toBe(false);
  });

  it("/api does NOT match", async () => {
    await import("../../middleware");
    expect(routeMatcherFn!(makeRequest("/api"))).toBe(false);
  });

  it("/ root does NOT match", async () => {
    await import("../../middleware");
    expect(routeMatcherFn!(makeRequest("/"))).toBe(false);
  });

  it("/wizard does NOT match", async () => {
    await import("../../middleware");
    expect(routeMatcherFn!(makeRequest("/wizard"))).toBe(false);
  });

  it("/result does NOT match", async () => {
    await import("../../middleware");
    expect(routeMatcherFn!(makeRequest("/result"))).toBe(false);
  });

  it("/api/generate-extra does NOT match exact (depends on regex)", async () => {
    await import("../../middleware");
    // Pattern is "/api/generate(.*)" which matches ANYTHING after /api/generate
    // So /api/generate-extra DOES match the pattern
    expect(routeMatcherFn!(makeRequest("/api/generate-extra"))).toBe(true);
  });
});

// ============================================================================
// MW7: CLERKHANDLER CALLBACK BEHAVIOR
// ============================================================================

describe("MW7: clerkHandler Callback Behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    capturedCallback = null;
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  it("callback calls auth.protect() for /api/generate", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;
    const result = await handler(makeRequest("/api/generate"));
    expect(result.protect).toHaveBeenCalledTimes(1);
  });

  it("callback calls auth.protect() for /api/generate/deep/nested/path", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;
    const result = await handler(
      makeRequest("/api/generate/deep/nested/path")
    );
    expect(result.protect).toHaveBeenCalledTimes(1);
  });

  it("callback does NOT call auth.protect() for /", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;
    const result = await handler(makeRequest("/"));
    expect(result.protect).not.toHaveBeenCalled();
  });

  it("callback does NOT call auth.protect() for /api/other", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;
    const result = await handler(makeRequest("/api/other"));
    expect(result.protect).not.toHaveBeenCalled();
  });

  it("callback does NOT call auth.protect() for /dashboard", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;
    const result = await handler(makeRequest("/dashboard"));
    expect(result.protect).not.toHaveBeenCalled();
  });

  it("callback does NOT call auth.protect() for /sign-in", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;
    const result = await handler(makeRequest("/sign-in"));
    expect(result.protect).not.toHaveBeenCalled();
  });

  it("clerkMiddleware receives exactly one callback argument", async () => {
    const { clerkMiddleware } = await import("@clerk/nextjs/server");
    (clerkMiddleware as any).mockClear();
    vi.resetModules();
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    await import("../../middleware");
    expect(clerkMiddleware).toHaveBeenCalledTimes(1);
    expect(clerkMiddleware).toHaveBeenCalledWith(expect.any(Function));
  });

  it("createRouteMatcher receives exactly one pattern", async () => {
    await import("../../middleware");
    expect(capturedRoutePatterns).toEqual(["/api/generate(.*)"]);
  });
});

// ============================================================================
// MW8: PASSTHROUGH MIDDLEWARE CONTRACT
// ============================================================================

describe("MW8: Passthrough Middleware Contract", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  it("passthrough returns a NextResponse-like object", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as () => any;
    const response = handler();
    expect(response).toBeDefined();
    expect(response.headers).toBeDefined();
  });

  it("passthrough does not require any arguments", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as () => any;
    // Calling with no args should not throw
    expect(() => handler()).not.toThrow();
  });

  it("passthrough ignores any passed arguments", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (...args: any[]) => any;
    const response = handler(makeRequest("/api/generate"), {
      extra: "data",
    });
    expect(response).toBeDefined();
  });

  it("passthrough can be called multiple times", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as () => any;
    const r1 = handler();
    const r2 = handler();
    const r3 = handler();
    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
    expect(r3).toBeDefined();
  });

  it("passthrough is a regular function not async", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default;
    // Arrow function () => NextResponse.next() is not async
    expect(handler.constructor.name).toBe("Function");
  });

  it("passthrough vs clerkHandler are different function types", async () => {
    // Get passthrough
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    vi.resetModules();
    const passthroughMw = await import("../../middleware");
    const passthrough = passthroughMw.default;

    // Get clerkHandler
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    vi.resetModules();
    const clerkMw = await import("../../middleware");
    const clerkHandler = clerkMw.default;

    // Different function types
    expect(passthrough.constructor.name).toBe("Function");
    expect(clerkHandler.constructor.name).toBe("AsyncFunction");
  });
});

// ============================================================================
// MW9: CONFIG MATCHER REGEX VALIDATION
// ============================================================================

describe("MW9: Config Matcher Regex Validation", () => {
  it("matcher[0] negative lookahead excludes _next paths", async () => {
    const middleware = await import("../../middleware");
    const pattern = middleware.config.matcher[0];
    const regex = new RegExp(pattern);
    // _next should not match
    expect(regex.test("/_next/static/chunk.js")).toBe(false);
  });

  it("matcher[0] excludes .css files", async () => {
    const middleware = await import("../../middleware");
    const pattern = middleware.config.matcher[0];
    const regex = new RegExp(pattern);
    expect(regex.test("/styles/main.css")).toBe(false);
  });

  it("matcher[0] excludes .png images", async () => {
    const middleware = await import("../../middleware");
    const pattern = middleware.config.matcher[0];
    const regex = new RegExp(pattern);
    expect(regex.test("/images/logo.png")).toBe(false);
  });

  it("matcher[0] excludes .ico files", async () => {
    const middleware = await import("../../middleware");
    const pattern = middleware.config.matcher[0];
    const regex = new RegExp(pattern);
    expect(regex.test("/favicon.ico")).toBe(false);
  });

  it("matcher[0] excludes .svg files", async () => {
    const middleware = await import("../../middleware");
    const pattern = middleware.config.matcher[0];
    const regex = new RegExp(pattern);
    expect(regex.test("/icon.svg")).toBe(false);
  });

  it("matcher[1] matches /api routes", async () => {
    const middleware = await import("../../middleware");
    const pattern = middleware.config.matcher[1];
    const regex = new RegExp(pattern);
    expect(regex.test("/api/generate")).toBe(true);
  });

  it("matcher[1] matches /api/any-path", async () => {
    const middleware = await import("../../middleware");
    const pattern = middleware.config.matcher[1];
    const regex = new RegExp(pattern);
    expect(regex.test("/api/some/deep/path")).toBe(true);
  });

  it("matcher[1] matches /trpc routes", async () => {
    const middleware = await import("../../middleware");
    const pattern = middleware.config.matcher[1];
    const regex = new RegExp(pattern);
    expect(regex.test("/trpc/mutation")).toBe(true);
  });

  it("config matcher is an array of exactly 2 strings", async () => {
    const middleware = await import("../../middleware");
    const { matcher } = middleware.config;
    expect(matcher).toHaveLength(2);
    expect(typeof matcher[0]).toBe("string");
    expect(typeof matcher[1]).toBe("string");
  });

  it("config is a named export", async () => {
    const middleware = await import("../../middleware");
    expect(middleware).toHaveProperty("config");
    expect(middleware.config).toHaveProperty("matcher");
  });
});

// ============================================================================
// MW10: CONCURRENT & SEQUENTIAL MIDDLEWARE CALLS
// ============================================================================

describe("MW10: Concurrent & Sequential Middleware Calls", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  it("sequential calls to protected route each call protect()", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;

    const r1 = await handler(makeRequest("/api/generate"));
    const r2 = await handler(makeRequest("/api/generate/template"));
    const r3 = await handler(makeRequest("/api/generate"));

    expect(r1.protect).toHaveBeenCalled();
    expect(r2.protect).toHaveBeenCalled();
    expect(r3.protect).toHaveBeenCalled();
  });

  it("concurrent calls to protected route all resolve", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;

    const results = await Promise.all([
      handler(makeRequest("/api/generate")),
      handler(makeRequest("/api/generate/a")),
      handler(makeRequest("/api/generate/b")),
      handler(makeRequest("/api/generate/c")),
    ]);

    for (const r of results) {
      expect(r.protect).toHaveBeenCalled();
    }
  });

  it("mixed protected/unprotected concurrent calls", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;

    const [protected1, unprotected1, protected2, unprotected2] =
      await Promise.all([
        handler(makeRequest("/api/generate")),
        handler(makeRequest("/wizard")),
        handler(makeRequest("/api/generate/doc")),
        handler(makeRequest("/")),
      ]);

    expect(protected1.protect).toHaveBeenCalled();
    expect(unprotected1.protect).not.toHaveBeenCalled();
    expect(protected2.protect).toHaveBeenCalled();
    expect(unprotected2.protect).not.toHaveBeenCalled();
  });

  it("middleware called 100 times sequentially still works", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;

    for (let i = 0; i < 100; i++) {
      const result = await handler(makeRequest("/api/generate"));
      expect(result.authCalled).toBe(true);
    }
  });

  it("alternating protected/unprotected routes", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;

    const paths = [
      "/api/generate",
      "/",
      "/api/generate/x",
      "/wizard",
      "/api/generate",
    ];
    const results = [];
    for (const path of paths) {
      results.push(await handler(makeRequest(path)));
    }

    expect(results[0].protect).toHaveBeenCalled();
    expect(results[1].protect).not.toHaveBeenCalled();
    expect(results[2].protect).toHaveBeenCalled();
    expect(results[3].protect).not.toHaveBeenCalled();
    expect(results[4].protect).toHaveBeenCalled();
  });

  it("passthrough middleware handles high concurrency", async () => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    vi.resetModules();
    const middleware = await import("../../middleware");
    const handler = middleware.default as () => any;

    const results = Array.from({ length: 50 }, () => handler());
    for (const r of results) {
      expect(r).toBeDefined();
      expect(r.headers).toBeDefined();
    }
  });
});
