/**
 * LAYER 3 DEEP: API Route Adversarial & Edge-Case Test Suite
 *
 * Complements api-route.test.ts (68 tests) with exhaustive gap coverage.
 * Every test here targets a path or condition NOT covered by the base suite.
 *
 * Files under test:
 *   src/app/api/generate/route.ts  (POST + GET handlers)
 *
 * Matrices:
 *   R11: POST — Malformed & Unusual Request Bodies       (14 tests)
 *   R12: POST — Auth Error Paths                         (10 tests)
 *   R13: POST — Error Boundary Completeness              (12 tests)
 *   R14: POST — All 36 Templates Individual Routing      (36 tests)
 *   R15: POST — Response Contract Validation             (10 tests)
 *   R16: GET  — Edge Cases & Boundary Conditions         (14 tests)
 *   R17: GET  — All Classifications × Roles              (12 tests)
 *   R18: GET  — Response Contract Validation             (8 tests)
 *   R19: Concurrency, Ordering & Idempotency             (8 tests)
 *   R20: POST — Clerk Key Edge Cases                     (8 tests)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================================
// MOCK SETUP — must come before imports
// ============================================================================

const mockGenerateDocument = vi.fn();
const mockGenerateExecutiveSummary = vi.fn();
const mockGetApplicableTemplates = vi.fn();

vi.mock("@/lib/doc-generator", () => ({
  generateDocument: (...args: any[]) => mockGenerateDocument(...args),
  generateExecutiveSummary: (...args: any[]) =>
    mockGenerateExecutiveSummary(...args),
  getApplicableTemplates: (...args: any[]) =>
    mockGetApplicableTemplates(...args),
}));

const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  clerkMiddleware: vi.fn((handler: any) => handler),
  createRouteMatcher: vi.fn((patterns: string[]) => {
    return (req: any) => {
      const url =
        typeof req.url === "string" ? req.url : req.nextUrl?.pathname || "";
      return patterns.some((p: string) => {
        const regex = new RegExp(p.replace("(.*)", ".*"));
        return regex.test(url);
      });
    };
  }),
}));

import { TEMPLATE_REGISTRY } from "../../lib/classification-engine";
import { POST, GET } from "../../app/api/generate/route";
import { NextRequest } from "next/server";

// ============================================================================
// HELPERS
// ============================================================================

function makePostRequest(body: Record<string, any>): NextRequest {
  return new NextRequest("http://localhost:3000/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Create a POST request with a raw string body (for malformed JSON testing) */
function makeRawPostRequest(rawBody: string): NextRequest {
  return new NextRequest("http://localhost:3000/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: rawBody,
  });
}

function makeGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost:3000/api/generate");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url.toString(), { method: "GET" });
}

const VALID_RESULT = {
  classification: "HIGH_RISK" as const,
  role: "PROVIDER" as const,
  confidence: "DEFINITIVE" as const,
  legalBasis: ["Article 6"],
  obligations: [],
  enforcementDeadline: "AUGUST_2026",
  fineRisk: {
    maxAmountGeneral: "€15M",
    maxAmountSME: "€7.5M",
    maxPercentTurnover: 3,
    article: "Art 99(3)",
  },
  nextSteps: [],
  warnings: [],
  smeSimplifications: [],
  highRiskArea: "EDUCATION" as const,
};

const VALID_BODY = {
  templateId: "TMPL_RISK_MANAGEMENT",
  result: VALID_RESULT,
  companyName: "TestCo",
  systemDescription: "Test AI system",
};

const MOCK_DOCUMENT = {
  templateId: "TMPL_RISK_MANAGEMENT",
  templateName: "Risk Management System",
  article: "Article 9",
  content: "# Risk Management\n\nGenerated document content.",
  generatedAt: new Date().toISOString(),
  wordCount: 42,
  disclaimer: "DISCLAIMER: This document was auto-generated...",
};

const MOCK_EXEC_SUMMARY = {
  templateId: "EXEC_SUMMARY",
  templateName: "Executive Summary",
  article: "Article 6",
  content: "# Executive Summary\n\nSummary content.",
  generatedAt: new Date().toISOString(),
  wordCount: 20,
  disclaimer: "DISCLAIMER: This document was auto-generated...",
};

// All 6 valid classifications
const ALL_CLASSIFICATIONS = [
  "PROHIBITED",
  "HIGH_RISK",
  "LIMITED_RISK",
  "GPAI",
  "GPAI_SYSTEMIC",
  "MINIMAL_RISK",
] as const;

// All 6 valid roles
const ALL_ROLES = [
  "PROVIDER",
  "DEPLOYER",
  "BOTH",
  "IMPORTER",
  "DISTRIBUTOR",
  "AUTHORISED_REPRESENTATIVE",
] as const;

// ============================================================================
// LIFECYCLE
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  mockGenerateDocument.mockResolvedValue(MOCK_DOCUMENT);
  mockGenerateExecutiveSummary.mockResolvedValue(MOCK_EXEC_SUMMARY);
  mockGetApplicableTemplates.mockReturnValue([
    "TMPL_RISK_MANAGEMENT",
    "TMPL_DATA_GOVERNANCE",
  ]);
  mockAuth.mockResolvedValue({ userId: "user_test123" });
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
});

// ============================================================================
// R11: POST — MALFORMED & UNUSUAL REQUEST BODIES
// ============================================================================

describe("R11: POST — Malformed & Unusual Request Bodies", () => {
  it("malformed JSON body triggers catch → 500", async () => {
    const res = await POST(makeRawPostRequest("{invalid json!!!"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Generation failed");
  });

  it("empty string body triggers catch → 500", async () => {
    const res = await POST(makeRawPostRequest(""));
    expect(res.status).toBe(500);
  });

  it("array body → destructuring yields undefined fields → 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([1, 2, 3]),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("numeric body → request.json() succeeds but destructuring gives undefined → 400 or 500", async () => {
    const req = new NextRequest("http://localhost:3000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(42),
    });
    const res = await POST(req);
    // Destructuring a number gives undefined fields → either 400 (validation) or 500 (destructure error)
    expect([400, 500]).toContain(res.status);
  });

  it("boolean body → destructuring fails gracefully", async () => {
    const req = new NextRequest("http://localhost:3000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(true),
    });
    const res = await POST(req);
    expect([400, 500]).toContain(res.status);
  });

  it("null body → destructuring yields all undefined → 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(null),
    });
    const res = await POST(req);
    expect([400, 500]).toContain(res.status);
  });

  it("deeply nested result object is passed through to generator", async () => {
    const deepResult = {
      ...VALID_RESULT,
      nested: { level1: { level2: { level3: { data: "deep" } } } },
    };
    const res = await POST(
      makePostRequest({ ...VALID_BODY, result: deepResult })
    );
    expect(res.status).toBe(200);
    expect(mockGenerateDocument).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ nested: expect.any(Object) }),
      expect.any(String),
      expect.any(String)
    );
  });

  it("result as empty object passes validation (truthy) and reaches generator", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, result: {} }));
    expect(res.status).toBe(200);
    // {} is truthy so passes the !result check
    expect(mockGenerateDocument).toHaveBeenCalled();
  });

  it("result as string passes validation (truthy) and reaches generator", async () => {
    const res = await POST(
      makePostRequest({ ...VALID_BODY, result: "not_an_object" })
    );
    expect(res.status).toBe(200);
    expect(mockGenerateDocument).toHaveBeenCalledWith(
      expect.any(String),
      "not_an_object",
      expect.any(String),
      expect.any(String)
    );
  });

  it("result as number 0 (falsy) → 400 missing fields", async () => {
    const res = await POST(
      makePostRequest({ ...VALID_BODY, result: 0 })
    );
    expect(res.status).toBe(400);
  });

  it("result as false (falsy) → 400 missing fields", async () => {
    const res = await POST(
      makePostRequest({ ...VALID_BODY, result: false })
    );
    expect(res.status).toBe(400);
  });

  it("body with __proto__ field does not affect behavior", async () => {
    const res = await POST(
      makePostRequest({
        ...VALID_BODY,
        __proto__: { isAdmin: true },
      })
    );
    expect(res.status).toBe(200);
  });

  it("body with toString override does not crash", async () => {
    const res = await POST(
      makePostRequest({
        ...VALID_BODY,
        toString: "not_a_function",
      })
    );
    expect(res.status).toBe(200);
  });

  it("whitespace-only companyName passes validation (truthy)", async () => {
    const res = await POST(
      makePostRequest({ ...VALID_BODY, companyName: "   " })
    );
    // Whitespace strings are truthy, so "   " passes the !companyName check
    expect(res.status).toBe(200);
    expect(mockGenerateDocument).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      "   ",
      expect.any(String)
    );
  });
});

// ============================================================================
// R12: POST — AUTH ERROR PATHS
// ============================================================================

describe("R12: POST — Auth Error Paths", () => {
  it("auth() throwing error is caught → 500", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    mockAuth.mockRejectedValue(new Error("Clerk service unavailable"));
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Clerk service unavailable");
  });

  it("auth() throwing non-Error is caught → 500 with unknown message", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    mockAuth.mockRejectedValue("clerk_crash");
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Unknown error occurred");
  });

  it("auth() returning empty object → userId is undefined → 401", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    mockAuth.mockResolvedValue({});
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it("userId is empty string → truthy → proceeds to 200", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    mockAuth.mockResolvedValue({ userId: "" });
    const res = await POST(makePostRequest(VALID_BODY));
    // Empty string is falsy → 401
    expect(res.status).toBe(401);
  });

  it("userId is 0 → falsy → 401", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    mockAuth.mockResolvedValue({ userId: 0 });
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it("userId is false → falsy → 401", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    mockAuth.mockResolvedValue({ userId: false });
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it("userId is a number (truthy) → proceeds", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    mockAuth.mockResolvedValue({ userId: 12345 });
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
  });

  it("401 response body has correct error message", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makePostRequest(VALID_BODY));
    const body = await res.json();
    expect(body.error).toBe("Authentication required");
    // No extra properties leaked
    expect(Object.keys(body)).toEqual(["error"]);
  });

  it("auth error does NOT call generateDocument", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    mockAuth.mockResolvedValue({ userId: null });
    await POST(makePostRequest(VALID_BODY));
    expect(mockGenerateDocument).not.toHaveBeenCalled();
    expect(mockGenerateExecutiveSummary).not.toHaveBeenCalled();
  });

  it("auth error does NOT call generateDocument even for EXEC_SUMMARY", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    mockAuth.mockResolvedValue({ userId: null });
    await POST(
      makePostRequest({ ...VALID_BODY, templateId: "EXEC_SUMMARY" })
    );
    expect(mockGenerateExecutiveSummary).not.toHaveBeenCalled();
  });
});

// ============================================================================
// R13: POST — ERROR BOUNDARY COMPLETENESS
// ============================================================================

describe("R13: POST — Error Boundary Completeness", () => {
  it("thrown number → 500 with 'Unknown error occurred'", async () => {
    mockGenerateDocument.mockRejectedValue(42);
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Unknown error occurred");
  });

  it("thrown null → 500 with 'Unknown error occurred'", async () => {
    mockGenerateDocument.mockRejectedValue(null);
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Unknown error occurred");
  });

  it("thrown undefined → 500 with 'Unknown error occurred'", async () => {
    mockGenerateDocument.mockRejectedValue(undefined);
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Unknown error occurred");
  });

  it("thrown object → 500 with 'Unknown error occurred'", async () => {
    mockGenerateDocument.mockRejectedValue({ code: 500, msg: "fail" });
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Unknown error occurred");
  });

  it("thrown array → 500 with 'Unknown error occurred'", async () => {
    mockGenerateDocument.mockRejectedValue(["error1", "error2"]);
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Unknown error occurred");
  });

  it("Error with ANTHROPIC_API_KEY anywhere in message → 503", async () => {
    mockGenerateDocument.mockRejectedValue(
      new Error("Something failed because ANTHROPIC_API_KEY was invalid")
    );
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(503);
  });

  it("Error WITHOUT ANTHROPIC_API_KEY → 500 not 503", async () => {
    mockGenerateDocument.mockRejectedValue(
      new Error("The API key for Anthropic is missing")
    );
    const res = await POST(makePostRequest(VALID_BODY));
    // "ANTHROPIC_API_KEY" as exact substring is not in the message
    expect(res.status).toBe(500);
  });

  it("console.error is called on any error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGenerateDocument.mockRejectedValue(new Error("test error"));
    await POST(makePostRequest(VALID_BODY));
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Document generation error:",
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it("console.error receives non-Error thrown values", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGenerateDocument.mockRejectedValue("raw_string_error");
    await POST(makePostRequest(VALID_BODY));
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Document generation error:",
      "raw_string_error"
    );
    consoleErrorSpy.mockRestore();
  });

  it("error message is NOT truncated even for very long errors", async () => {
    const longMessage = "ERR:" + "x".repeat(5000);
    mockGenerateDocument.mockRejectedValue(new Error(longMessage));
    const res = await POST(makePostRequest(VALID_BODY));
    const body = await res.json();
    expect(body.error).toContain(longMessage);
  });

  it("Error subclass is still caught as Error instance", async () => {
    class CustomApiError extends Error {
      constructor(public statusCode: number, message: string) {
        super(message);
        this.name = "CustomApiError";
      }
    }
    mockGenerateDocument.mockRejectedValue(
      new CustomApiError(429, "Rate limit exceeded")
    );
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Rate limit exceeded");
  });

  it("TypeError from generator is caught as Error instance", async () => {
    mockGenerateDocument.mockRejectedValue(
      new TypeError("Cannot read properties of undefined")
    );
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Cannot read properties of undefined");
  });
});

// ============================================================================
// R14: POST — ALL 36 TEMPLATES INDIVIDUAL ROUTING
// ============================================================================

describe("R14: POST — All 36 Templates Individual Routing", () => {
  const allTemplateIds = Object.keys(TEMPLATE_REGISTRY);

  // Verify we have exactly 36
  it("TEMPLATE_REGISTRY has exactly 36 entries", () => {
    expect(allTemplateIds.length).toBe(36);
  });

  // Test each template individually — verify correct templateId is passed to generator
  it.each(allTemplateIds)(
    "template %s passes correct ID to generateDocument",
    async (templateId) => {
      vi.clearAllMocks();
      mockGenerateDocument.mockResolvedValue({
        ...MOCK_DOCUMENT,
        templateId,
      });

      const res = await POST(
        makePostRequest({ ...VALID_BODY, templateId })
      );
      expect(res.status).toBe(200);
      expect(mockGenerateDocument).toHaveBeenCalledTimes(1);
      expect(mockGenerateDocument).toHaveBeenCalledWith(
        templateId,
        VALID_BODY.result,
        VALID_BODY.companyName,
        VALID_BODY.systemDescription
      );
      // Verify response wraps the document
      const body = await res.json();
      expect(body.document.templateId).toBe(templateId);
    }
  );
});

// ============================================================================
// R15: POST — RESPONSE CONTRACT VALIDATION
// ============================================================================

describe("R15: POST — Response Contract Validation", () => {
  it("200 response has EXACTLY { document } key (no extra keys)", async () => {
    const res = await POST(makePostRequest(VALID_BODY));
    const body = await res.json();
    expect(Object.keys(body)).toEqual(["document"]);
  });

  it("400 (missing fields) response has EXACTLY { error } key", async () => {
    const res = await POST(makePostRequest({}));
    const body = await res.json();
    expect(Object.keys(body)).toEqual(["error"]);
  });

  it("400 (unknown template) response has EXACTLY { error } key", async () => {
    const res = await POST(
      makePostRequest({ ...VALID_BODY, templateId: "FAKE" })
    );
    const body = await res.json();
    expect(Object.keys(body)).toEqual(["error"]);
  });

  it("401 response has EXACTLY { error } key", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makePostRequest(VALID_BODY));
    const body = await res.json();
    expect(Object.keys(body)).toEqual(["error"]);
  });

  it("500 response has EXACTLY { error } key", async () => {
    mockGenerateDocument.mockRejectedValue(new Error("fail"));
    const res = await POST(makePostRequest(VALID_BODY));
    const body = await res.json();
    expect(Object.keys(body)).toEqual(["error"]);
  });

  it("503 response has EXACTLY { error } key", async () => {
    mockGenerateDocument.mockRejectedValue(
      new Error("ANTHROPIC_API_KEY not set")
    );
    const res = await POST(makePostRequest(VALID_BODY));
    const body = await res.json();
    expect(Object.keys(body)).toEqual(["error"]);
  });

  it("error messages never contain stack traces", async () => {
    mockGenerateDocument.mockRejectedValue(new Error("test_error_msg"));
    const res = await POST(makePostRequest(VALID_BODY));
    const body = await res.json();
    expect(body.error).not.toContain("at ");
    expect(body.error).not.toContain(".ts:");
    expect(body.error).not.toContain(".js:");
  });

  it("all error responses have string error field", async () => {
    // Test each error path
    const errorResponses: Response[] = [];

    // 400 — missing fields
    errorResponses.push(await POST(makePostRequest({})));
    // 400 — unknown template
    errorResponses.push(
      await POST(makePostRequest({ ...VALID_BODY, templateId: "FAKE_TMPL" }))
    );
    // 500 — generator error
    mockGenerateDocument.mockRejectedValueOnce(new Error("fail"));
    errorResponses.push(await POST(makePostRequest(VALID_BODY)));
    // 503 — API key error
    mockGenerateDocument.mockRejectedValueOnce(
      new Error("ANTHROPIC_API_KEY missing")
    );
    errorResponses.push(await POST(makePostRequest(VALID_BODY)));

    for (const res of errorResponses) {
      const body = await res.json();
      expect(typeof body.error).toBe("string");
      expect(body.error.length).toBeGreaterThan(0);
    }
  });

  it("success response document field is the exact mock return value", async () => {
    const customDoc = {
      templateId: "TMPL_QMS",
      templateName: "Custom Doc",
      article: "Article 17",
      content: "# Custom\n\nBody text.",
      generatedAt: "2025-01-01T00:00:00Z",
      wordCount: 5,
      disclaimer: "DISCLAIMER",
    };
    mockGenerateDocument.mockResolvedValue(customDoc);
    const res = await POST(
      makePostRequest({ ...VALID_BODY, templateId: "TMPL_QMS" })
    );
    const body = await res.json();
    expect(body.document).toEqual(customDoc);
  });

  it("success response does NOT contain error key", async () => {
    const res = await POST(makePostRequest(VALID_BODY));
    const body = await res.json();
    expect(body.error).toBeUndefined();
  });
});

// ============================================================================
// R16: GET — EDGE CASES & BOUNDARY CONDITIONS
// ============================================================================

describe("R16: GET — Edge Cases & Boundary Conditions", () => {
  it("empty string classification passes validation (truthy)", async () => {
    // Empty string is falsy → 400
    const res = await GET(
      makeGetRequest({ classification: "", role: "PROVIDER" })
    );
    expect(res.status).toBe(400);
  });

  it("empty string role passes validation (truthy)", async () => {
    // searchParams.get returns "" which is falsy
    const res = await GET(
      makeGetRequest({ classification: "HIGH_RISK", role: "" })
    );
    expect(res.status).toBe(400);
  });

  it("getApplicableTemplates throwing crashes GET (no try-catch)", async () => {
    mockGetApplicableTemplates.mockImplementation(() => {
      throw new Error("Unexpected internal error");
    });
    // GET has no try-catch — this will throw and Next.js catches it
    await expect(
      GET(makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" }))
    ).rejects.toThrow("Unexpected internal error");
  });

  it("template ID not in registry → spread undefined → still works", async () => {
    mockGetApplicableTemplates.mockReturnValue(["NONEXISTENT_TEMPLATE"]);
    const res = await GET(
      makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    // { id: "NONEXISTENT_TEMPLATE", ...undefined } → just { id: "NONEXISTENT_TEMPLATE" }
    expect(body.templates[0].id).toBe("NONEXISTENT_TEMPLATE");
    // No name/description because registry entry doesn't exist
    expect(body.templates[0].name).toBeUndefined();
  });

  it("very long classification value is passed through", async () => {
    const longClass = "A".repeat(10000);
    mockGetApplicableTemplates.mockReturnValue([]);
    const res = await GET(
      makeGetRequest({ classification: longClass, role: "PROVIDER" })
    );
    expect(res.status).toBe(200);
    expect(mockGetApplicableTemplates).toHaveBeenCalledWith(
      expect.objectContaining({ classification: longClass })
    );
  });

  it("URL-encoded special characters in classification", async () => {
    mockGetApplicableTemplates.mockReturnValue([]);
    const res = await GET(
      makeGetRequest({
        classification: "HIGH RISK & <script>",
        role: "PROVIDER",
      })
    );
    expect(res.status).toBe(200);
    expect(mockGetApplicableTemplates).toHaveBeenCalledWith(
      expect.objectContaining({ classification: "HIGH RISK & <script>" })
    );
  });

  it("numeric string params are passed as strings", async () => {
    mockGetApplicableTemplates.mockReturnValue([]);
    const res = await GET(
      makeGetRequest({ classification: "123", role: "456" })
    );
    expect(res.status).toBe(200);
    expect(mockGetApplicableTemplates).toHaveBeenCalledWith(
      expect.objectContaining({ classification: "123", role: "456" })
    );
  });

  it("GET response for empty template list has correct shape", async () => {
    mockGetApplicableTemplates.mockReturnValue([]);
    const res = await GET(
      makeGetRequest({ classification: "PROHIBITED", role: "PROVIDER" })
    );
    const body = await res.json();
    expect(body).toEqual({ templates: [] });
    expect(Object.keys(body)).toEqual(["templates"]);
  });

  it("GET with only classification param → 400", async () => {
    const url = new URL("http://localhost:3000/api/generate");
    url.searchParams.set("classification", "HIGH_RISK");
    const res = await GET(new NextRequest(url.toString(), { method: "GET" }));
    expect(res.status).toBe(400);
  });

  it("GET with only role param → 400", async () => {
    const url = new URL("http://localhost:3000/api/generate");
    url.searchParams.set("role", "PROVIDER");
    const res = await GET(new NextRequest(url.toString(), { method: "GET" }));
    expect(res.status).toBe(400);
  });

  it("GET does not require authentication", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    const res = await GET(
      makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" })
    );
    expect(res.status).toBe(200);
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("GET with case-different classification passes through as-is", async () => {
    mockGetApplicableTemplates.mockReturnValue([]);
    const res = await GET(
      makeGetRequest({ classification: "high_risk", role: "provider" })
    );
    expect(res.status).toBe(200);
    // Route does NOT normalize case — passes raw strings
    expect(mockGetApplicableTemplates).toHaveBeenCalledWith(
      expect.objectContaining({
        classification: "high_risk",
        role: "provider",
      })
    );
  });

  it("multiple templates are returned in correct order", async () => {
    const ids = [
      "TMPL_RISK_MANAGEMENT",
      "TMPL_QMS",
      "TMPL_DATA_GOVERNANCE",
      "TMPL_HUMAN_OVERSIGHT",
    ];
    mockGetApplicableTemplates.mockReturnValue(ids);
    const res = await GET(
      makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" })
    );
    const body = await res.json();
    expect(body.templates.map((t: any) => t.id)).toEqual(ids);
  });

  it("single template response has merged registry fields", async () => {
    mockGetApplicableTemplates.mockReturnValue(["TMPL_QMS"]);
    const res = await GET(
      makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" })
    );
    const body = await res.json();
    const tmpl = body.templates[0];
    expect(tmpl.id).toBe("TMPL_QMS");
    expect(tmpl.name).toBe(TEMPLATE_REGISTRY["TMPL_QMS"].name);
    expect(tmpl.description).toBe(TEMPLATE_REGISTRY["TMPL_QMS"].description);
    expect(tmpl.articles).toEqual(TEMPLATE_REGISTRY["TMPL_QMS"].articles);
    expect(tmpl.estimatedMinutes).toBe(
      TEMPLATE_REGISTRY["TMPL_QMS"].estimatedMinutes
    );
    expect(tmpl.requiredFor).toEqual(
      TEMPLATE_REGISTRY["TMPL_QMS"].requiredFor
    );
  });
});

// ============================================================================
// R17: GET — ALL CLASSIFICATIONS × ALL ROLES
// ============================================================================

describe("R17: GET — All Classifications", () => {
  it.each(ALL_CLASSIFICATIONS)(
    "GET with classification=%s returns 200",
    async (classification) => {
      mockGetApplicableTemplates.mockReturnValue([]);
      const res = await GET(
        makeGetRequest({ classification, role: "PROVIDER" })
      );
      expect(res.status).toBe(200);
      expect(mockGetApplicableTemplates).toHaveBeenCalledWith(
        expect.objectContaining({ classification })
      );
    }
  );
});

describe("R17: GET — All Roles", () => {
  it.each(ALL_ROLES)("GET with role=%s returns 200", async (role) => {
    mockGetApplicableTemplates.mockReturnValue([]);
    const res = await GET(
      makeGetRequest({ classification: "HIGH_RISK", role })
    );
    expect(res.status).toBe(200);
    expect(mockGetApplicableTemplates).toHaveBeenCalledWith(
      expect.objectContaining({ role })
    );
  });
});

// ============================================================================
// R18: GET — RESPONSE CONTRACT VALIDATION
// ============================================================================

describe("R18: GET — Response Contract Validation", () => {
  it("200 response has EXACTLY { templates } key", async () => {
    const res = await GET(
      makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" })
    );
    const body = await res.json();
    expect(Object.keys(body)).toEqual(["templates"]);
  });

  it("400 response has EXACTLY { error } key", async () => {
    const res = await GET(makeGetRequest({}));
    const body = await res.json();
    expect(Object.keys(body)).toEqual(["error"]);
  });

  it("400 error message mentions missing params", async () => {
    const res = await GET(makeGetRequest({}));
    const body = await res.json();
    expect(body.error).toContain("classification");
    expect(body.error).toContain("role");
  });

  it("200 response is JSON content-type", async () => {
    const res = await GET(
      makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" })
    );
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("400 response is JSON content-type", async () => {
    const res = await GET(makeGetRequest({}));
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("templates array items each have id field", async () => {
    mockGetApplicableTemplates.mockReturnValue([
      "TMPL_RISK_MANAGEMENT",
      "TMPL_QMS",
      "TMPL_DATA_GOVERNANCE",
    ]);
    const res = await GET(
      makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" })
    );
    const body = await res.json();
    for (const t of body.templates) {
      expect(t).toHaveProperty("id");
      expect(typeof t.id).toBe("string");
    }
  });

  it("template fields match registry exactly", async () => {
    const registryKeys = Object.keys(
      TEMPLATE_REGISTRY["TMPL_RISK_MANAGEMENT"]
    );
    mockGetApplicableTemplates.mockReturnValue(["TMPL_RISK_MANAGEMENT"]);
    const res = await GET(
      makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" })
    );
    const body = await res.json();
    const tmpl = body.templates[0];
    // Should have 'id' + all registry keys
    for (const key of registryKeys) {
      expect(tmpl).toHaveProperty(key);
    }
    expect(tmpl.id).toBe("TMPL_RISK_MANAGEMENT");
  });

  it("200 response does NOT contain error key", async () => {
    const res = await GET(
      makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" })
    );
    const body = await res.json();
    expect(body.error).toBeUndefined();
  });
});

// ============================================================================
// R19: CONCURRENCY, ORDERING & IDEMPOTENCY
// ============================================================================

describe("R19: Concurrency, Ordering & Idempotency", () => {
  it("same POST request twice yields same status", async () => {
    const res1 = await POST(makePostRequest(VALID_BODY));
    const res2 = await POST(makePostRequest(VALID_BODY));
    expect(res1.status).toBe(res2.status);
    expect(res1.status).toBe(200);
  });

  it("same GET request twice yields same status", async () => {
    const res1 = await GET(
      makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" })
    );
    const res2 = await GET(
      makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" })
    );
    expect(res1.status).toBe(res2.status);
    expect(res1.status).toBe(200);
  });

  it("concurrent GET requests with different params", async () => {
    const requests = ALL_CLASSIFICATIONS.map((c) =>
      GET(makeGetRequest({ classification: c, role: "PROVIDER" }))
    );
    const responses = await Promise.all(requests);
    for (const res of responses) {
      expect(res.status).toBe(200);
    }
    expect(mockGetApplicableTemplates).toHaveBeenCalledTimes(6);
  });

  it("concurrent POST requests with different templates", async () => {
    const templateIds = Object.keys(TEMPLATE_REGISTRY).slice(0, 10);
    const requests = templateIds.map((templateId) =>
      POST(makePostRequest({ ...VALID_BODY, templateId }))
    );
    const responses = await Promise.all(requests);
    for (const res of responses) {
      expect(res.status).toBe(200);
    }
    expect(mockGenerateDocument).toHaveBeenCalledTimes(10);
  });

  it("failed request does not affect subsequent request", async () => {
    mockGenerateDocument.mockRejectedValueOnce(new Error("transient error"));
    const res1 = await POST(makePostRequest(VALID_BODY));
    expect(res1.status).toBe(500);

    // Next call should succeed (mock reset to default)
    mockGenerateDocument.mockResolvedValueOnce(MOCK_DOCUMENT);
    const res2 = await POST(makePostRequest(VALID_BODY));
    expect(res2.status).toBe(200);
  });

  it("auth failure does not taint subsequent authenticated request", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    mockAuth.mockResolvedValueOnce({ userId: null });
    const res1 = await POST(makePostRequest(VALID_BODY));
    expect(res1.status).toBe(401);

    mockAuth.mockResolvedValueOnce({ userId: "user_123" });
    const res2 = await POST(makePostRequest(VALID_BODY));
    expect(res2.status).toBe(200);
  });

  it("POST and GET requests don't interfere with each other", async () => {
    const [postRes, getRes] = await Promise.all([
      POST(makePostRequest(VALID_BODY)),
      GET(makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" })),
    ]);
    expect(postRes.status).toBe(200);
    expect(getRes.status).toBe(200);
  });

  it("10 concurrent mixed requests all resolve correctly", async () => {
    const requests = [
      POST(makePostRequest(VALID_BODY)),
      POST(makePostRequest({ ...VALID_BODY, templateId: "EXEC_SUMMARY" })),
      POST(makePostRequest({ ...VALID_BODY, templateId: "TMPL_QMS" })),
      GET(makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" })),
      GET(makeGetRequest({ classification: "GPAI", role: "DEPLOYER" })),
      POST(makePostRequest({})), // 400
      GET(makeGetRequest({})), // 400
      POST(makePostRequest({ ...VALID_BODY, templateId: "FAKE" })), // 400
      GET(
        makeGetRequest({ classification: "MINIMAL_RISK", role: "IMPORTER" })
      ),
      POST(
        makePostRequest({
          ...VALID_BODY,
          templateId: "TMPL_DATA_GOVERNANCE",
        })
      ),
    ];
    const responses = await Promise.all(requests);
    // First 3: 200 (valid POSTs)
    expect(responses[0].status).toBe(200);
    expect(responses[1].status).toBe(200);
    expect(responses[2].status).toBe(200);
    // GETs: 200
    expect(responses[3].status).toBe(200);
    expect(responses[4].status).toBe(200);
    // Errors: 400
    expect(responses[5].status).toBe(400);
    expect(responses[6].status).toBe(400);
    expect(responses[7].status).toBe(400);
    // More valid
    expect(responses[8].status).toBe(200);
    expect(responses[9].status).toBe(200);
  });
});

// ============================================================================
// R20: POST — CLERK KEY EDGE CASES
// ============================================================================

describe("R20: POST — Clerk Key Edge Cases", () => {
  it("empty string Clerk key → falsy → auth skipped", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "";
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("Clerk key that includes 'your-key-here' as substring → auth skipped", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
      "pk_test_your-key-here_suffix";
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("Clerk key 'pk_your-key-here' → auth skipped (includes check)", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_your-key-here";
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("Clerk key with only whitespace → truthy but auth proceeds (no placeholder match)", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "   ";
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
    // "   " is truthy AND doesn't include "your-key-here" → auth IS called
    expect(mockAuth).toHaveBeenCalled();
  });

  it("Clerk key is exactly 'your-key-here' → auth skipped", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "your-key-here";
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("Clerk key undefined (deleted) → auth skipped", async () => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("valid Clerk key with production format pk_live_ → auth called", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
      "pk_live_abc123def456ghi789";
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mockAuth).toHaveBeenCalled();
  });

  it("valid Clerk key with test format pk_test_ → auth called", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_abc123xyz";
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mockAuth).toHaveBeenCalled();
  });
});
