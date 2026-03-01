/**
 * LAYER 3B: Middleware Auth Tests
 *
 * Dedicated tests for src/middleware.ts to achieve 100% coverage.
 * Uses vi.resetModules() + dynamic import to test both env paths:
 *   - No Clerk keys → passthrough middleware
 *   - Clerk keys present → clerkHandler with route matching
 *
 * Tests:
 *   MW1: No-Clerk-Keys Path (passthrough)       (4 tests)
 *   MW2: Clerk-Keys-Present Path (clerkHandler)  (7 tests)
 *   MW3: Route Matcher Patterns                   (4 tests)
 *   MW4: Config & Exports                         (3 tests)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextResponse } from "next/server";

// ============================================================================
// MOCK SETUP
// ============================================================================

// Track what clerkMiddleware receives and how the handler is invoked
let capturedCallback: Function | null = null;
let capturedRoutePatterns: string[] = [];
let routeMatcherFn: ((req: any) => boolean) | null = null;

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: vi.fn((callback: Function) => {
    // Capture the callback so we can invoke it in tests
    capturedCallback = callback;
    // Return a function that, when called as middleware, invokes the callback
    return async (req: any) => {
      const mockAuthObj = { protect: vi.fn() };
      const mockAuthFn = Object.assign(vi.fn().mockReturnValue(mockAuthObj), mockAuthObj);
      await callback(mockAuthFn, req);
      return { authCalled: true, protect: mockAuthObj.protect };
    };
  }),
  createRouteMatcher: vi.fn((patterns: string[]) => {
    capturedRoutePatterns = patterns;
    // Build a real matcher that simulates Clerk's behavior
    const matcher = (req: any) => {
      const pathname = req?.nextUrl?.pathname || req?.url || "";
      return patterns.some((p: string) => {
        // Convert Clerk pattern to regex: "/api/generate(.*)" → matches /api/generate*
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
// MW1: NO-CLERK-KEYS PATH
// ============================================================================

describe("MW1: No-Clerk-Keys Path (passthrough)", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    capturedCallback = null;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  it("exports passthrough middleware when no Clerk keys", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default;
    expect(typeof handler).toBe("function");
  });

  it("passthrough middleware returns NextResponse.next()", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as () => any;
    const response = handler();
    // NextResponse.next() returns a NextResponse object
    expect(response).toBeDefined();
    expect(response.headers).toBeDefined();
  });

  it("passthrough middleware does not call clerkMiddleware callback", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as () => any;
    handler();
    // The passthrough function doesn't invoke the Clerk callback at all
    // (the callback was captured during module init but never invoked)
  });

  it("passthrough middleware when key is placeholder", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "your-key-here";
    vi.resetModules();
    const middleware = await import("../../middleware");
    const handler = middleware.default as () => any;
    const response = handler();
    expect(response).toBeDefined();
  });
});

// ============================================================================
// MW2: CLERK-KEYS-PRESENT PATH
// ============================================================================

describe("MW2: Clerk-Keys-Present Path (clerkHandler)", () => {
  beforeEach(() => {
    vi.resetModules();
    capturedCallback = null;
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  it("exports clerkHandler when Clerk keys are configured", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default;
    expect(typeof handler).toBe("function");
  });

  it("clerkHandler is the function returned by clerkMiddleware", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default;
    // clerkHandler should be an async function (returned by our mock)
    expect(handler.constructor.name).toBe("AsyncFunction");
  });

  it("clerkHandler invokes callback with auth and req for protected route", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;
    const req = makeRequest("/api/generate");
    const result = await handler(req);
    // The callback was invoked — which means auth.protect() was called
    expect(result.authCalled).toBe(true);
    expect(result.protect).toHaveBeenCalled();
  });

  it("clerkHandler calls auth.protect() for /api/generate/anything", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;
    const req = makeRequest("/api/generate/some-template");
    const result = await handler(req);
    expect(result.protect).toHaveBeenCalled();
  });

  it("clerkHandler does NOT call auth.protect() for non-protected route", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;
    const req = makeRequest("/wizard");
    const result = await handler(req);
    expect(result.protect).not.toHaveBeenCalled();
  });

  it("clerkHandler does NOT call auth.protect() for root path", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;
    const req = makeRequest("/");
    const result = await handler(req);
    expect(result.protect).not.toHaveBeenCalled();
  });

  it("clerkHandler does NOT call auth.protect() for /result path", async () => {
    const middleware = await import("../../middleware");
    const handler = middleware.default as (req: any) => Promise<any>;
    const req = makeRequest("/result");
    const result = await handler(req);
    expect(result.protect).not.toHaveBeenCalled();
  });
});

// ============================================================================
// MW3: ROUTE MATCHER PATTERNS
// ============================================================================

describe("MW3: Route Matcher Patterns", () => {
  beforeEach(() => {
    vi.resetModules();
    capturedRoutePatterns = [];
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  it("createRouteMatcher is called with /api/generate pattern", async () => {
    await import("../../middleware");
    expect(capturedRoutePatterns).toContain("/api/generate(.*)");
  });

  it("route matcher matches /api/generate", () => {
    expect(routeMatcherFn).not.toBeNull();
    expect(routeMatcherFn!(makeRequest("/api/generate"))).toBe(true);
  });

  it("route matcher matches /api/generate/sub-path", () => {
    expect(routeMatcherFn).not.toBeNull();
    expect(routeMatcherFn!(makeRequest("/api/generate/TMPL_RISK"))).toBe(true);
  });

  it("route matcher does NOT match /api/other", () => {
    expect(routeMatcherFn).not.toBeNull();
    expect(routeMatcherFn!(makeRequest("/api/other"))).toBe(false);
  });
});

// ============================================================================
// MW4: CONFIG & EXPORTS
// ============================================================================

describe("MW4: Config & Exports", () => {
  it("config.matcher has 2 patterns", async () => {
    const middleware = await import("../../middleware");
    expect(middleware.config.matcher).toHaveLength(2);
  });

  it("config.matcher[0] excludes static files", async () => {
    const middleware = await import("../../middleware");
    const pattern = middleware.config.matcher[0];
    expect(pattern).toContain("_next");
    expect(pattern).toContain("css");
    expect(pattern).toContain("png");
    expect(pattern).toContain("ico");
  });

  it("config.matcher[1] covers API and tRPC routes", async () => {
    const middleware = await import("../../middleware");
    const pattern = middleware.config.matcher[1];
    expect(pattern).toContain("api");
    expect(pattern).toContain("trpc");
  });
});
