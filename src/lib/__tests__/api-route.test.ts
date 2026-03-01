/**
 * LAYER 3: API Route + Middleware Test Suite
 *
 * Tests the HTTP layer — route.ts POST/GET handlers and middleware.ts auth logic.
 *
 * Files under test:
 *   src/app/api/generate/route.ts  (POST + GET handlers, 120 lines)
 *   src/middleware.ts              (Clerk auth middleware, 36 lines)
 *
 * 8 matrices:
 *   R1: POST — Authentication Branches          (6 tests)
 *   R2: POST — Field Validation                  (10 tests)
 *   R3: POST — Template Routing                  (6 tests)
 *   R4: POST — Success Response Shape            (7 tests)
 *   R5: POST — Error Handling                    (6 tests)
 *   R6: GET — Query Params Validation            (6 tests)
 *   R7: GET — Response Shape & Correctness       (8 tests)
 *   R8: Middleware Auth Logic                     (6 tests)
 *   R9: Exports & Config                         (3 tests)
 *   R10: Edge Cases & Adversarial Inputs         (10 tests)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================================
// MOCK SETUP — must come before imports
// ============================================================================

// Mock the doc-generator functions
const mockGenerateDocument = vi.fn();
const mockGenerateExecutiveSummary = vi.fn();
const mockGetApplicableTemplates = vi.fn();

vi.mock("@/lib/doc-generator", () => ({
  generateDocument: (...args: any[]) => mockGenerateDocument(...args),
  generateExecutiveSummary: (...args: any[]) => mockGenerateExecutiveSummary(...args),
  getApplicableTemplates: (...args: any[]) => mockGetApplicableTemplates(...args),
}));

// Mock Clerk auth
const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  clerkMiddleware: vi.fn((handler: any) => handler),
  createRouteMatcher: vi.fn((patterns: string[]) => {
    return (req: any) => {
      const url = typeof req.url === "string" ? req.url : req.nextUrl?.pathname || "";
      return patterns.some((p: string) => {
        const regex = new RegExp(p.replace("(.*)", ".*"));
        return regex.test(url);
      });
    };
  }),
}));

// We need the real TEMPLATE_REGISTRY
import { TEMPLATE_REGISTRY } from "../../lib/classification-engine";

// ============================================================================
// IMPORTS — after mocks
// ============================================================================

import { POST, GET, maxDuration } from "../../app/api/generate/route";
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
  fineRisk: { maxAmountGeneral: "€15M", maxAmountSME: "€7.5M", maxPercentTurnover: 3, article: "Art 99(3)" },
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

// ============================================================================
// LIFECYCLE
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no Clerk keys configured (dev mode)
  delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Default mock returns
  mockGenerateDocument.mockResolvedValue(MOCK_DOCUMENT);
  mockGenerateExecutiveSummary.mockResolvedValue(MOCK_EXEC_SUMMARY);
  mockGetApplicableTemplates.mockReturnValue(["TMPL_RISK_MANAGEMENT", "TMPL_DATA_GOVERNANCE"]);
  mockAuth.mockResolvedValue({ userId: "user_test123" });
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
});

// ============================================================================
// R1: POST — AUTHENTICATION BRANCHES
// ============================================================================

describe("R1: POST — Authentication", () => {
  it("skips auth when Clerk keys not configured", async () => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("skips auth when Clerk key is placeholder", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "your-key-here";
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("checks auth when Clerk keys are configured", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mockAuth).toHaveBeenCalled();
  });

  it("returns 401 when authenticated user is null", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Authentication required");
  });

  it("returns 401 when userId is undefined", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    mockAuth.mockResolvedValue({ userId: undefined });
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it("proceeds when userId is present", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    mockAuth.mockResolvedValue({ userId: "user_abc123" });
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
  });
});

// ============================================================================
// R2: POST — FIELD VALIDATION
// ============================================================================

describe("R2: POST — Field Validation", () => {
  it("returns 400 when templateId is missing", async () => {
    const { templateId, ...rest } = VALID_BODY;
    const res = await POST(makePostRequest(rest));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Missing required fields");
  });

  it("returns 400 when result is missing", async () => {
    const { result, ...rest } = VALID_BODY;
    const res = await POST(makePostRequest(rest));
    expect(res.status).toBe(400);
  });

  it("returns 400 when companyName is missing", async () => {
    const { companyName, ...rest } = VALID_BODY;
    const res = await POST(makePostRequest(rest));
    expect(res.status).toBe(400);
  });

  it("returns 400 when systemDescription is missing", async () => {
    const { systemDescription, ...rest } = VALID_BODY;
    const res = await POST(makePostRequest(rest));
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is empty", async () => {
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when templateId is empty string", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, templateId: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when companyName is empty string", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, companyName: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when systemDescription is empty string", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, systemDescription: "" }));
    expect(res.status).toBe(400);
  });

  it("accepts request with all valid fields", async () => {
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
  });

  it("extra fields in body are ignored", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, extraField: "ignored" }));
    expect(res.status).toBe(200);
  });
});

// ============================================================================
// R3: POST — TEMPLATE ROUTING
// ============================================================================

describe("R3: POST — Template Routing", () => {
  it("EXEC_SUMMARY calls generateExecutiveSummary", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, templateId: "EXEC_SUMMARY" }));
    expect(res.status).toBe(200);
    expect(mockGenerateExecutiveSummary).toHaveBeenCalledWith(
      VALID_BODY.result,
      VALID_BODY.companyName,
      VALID_BODY.systemDescription
    );
    expect(mockGenerateDocument).not.toHaveBeenCalled();
  });

  it("valid template calls generateDocument", async () => {
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mockGenerateDocument).toHaveBeenCalledWith(
      "TMPL_RISK_MANAGEMENT",
      VALID_BODY.result,
      VALID_BODY.companyName,
      VALID_BODY.systemDescription
    );
    expect(mockGenerateExecutiveSummary).not.toHaveBeenCalled();
  });

  it("unknown template returns 400", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, templateId: "NONEXISTENT" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Unknown template: NONEXISTENT");
  });

  it("EXEC_SUMMARY is not validated against registry", async () => {
    // EXEC_SUMMARY doesn't need to be in TEMPLATE_REGISTRY
    expect(TEMPLATE_REGISTRY["EXEC_SUMMARY"]).toBeUndefined();
    const res = await POST(makePostRequest({ ...VALID_BODY, templateId: "EXEC_SUMMARY" }));
    expect(res.status).toBe(200);
  });

  it("each valid template in registry passes validation", () => {
    const templateIds = Object.keys(TEMPLATE_REGISTRY);
    for (const id of templateIds) {
      expect(TEMPLATE_REGISTRY[id]).toBeDefined();
    }
    expect(templateIds.length).toBe(36);
  });

  it("passes correct arguments to generateDocument", async () => {
    const body = {
      templateId: "TMPL_QMS",
      result: { ...VALID_RESULT, classification: "HIGH_RISK" },
      companyName: "AcmeCorp",
      systemDescription: "HR screening tool",
    };
    await POST(makePostRequest(body));
    expect(mockGenerateDocument).toHaveBeenCalledWith(
      "TMPL_QMS",
      body.result,
      "AcmeCorp",
      "HR screening tool"
    );
  });
});

// ============================================================================
// R4: POST — SUCCESS RESPONSE SHAPE
// ============================================================================

describe("R4: POST — Success Response Shape", () => {
  it("returns 200 on success", async () => {
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(200);
  });

  it("response has document key", async () => {
    const res = await POST(makePostRequest(VALID_BODY));
    const body = await res.json();
    expect(body).toHaveProperty("document");
  });

  it("document has templateId", async () => {
    const res = await POST(makePostRequest(VALID_BODY));
    const body = await res.json();
    expect(body.document.templateId).toBe("TMPL_RISK_MANAGEMENT");
  });

  it("document has content", async () => {
    const res = await POST(makePostRequest(VALID_BODY));
    const body = await res.json();
    expect(body.document.content).toBeTruthy();
  });

  it("EXEC_SUMMARY response has correct templateId", async () => {
    const res = await POST(makePostRequest({ ...VALID_BODY, templateId: "EXEC_SUMMARY" }));
    const body = await res.json();
    expect(body.document.templateId).toBe("EXEC_SUMMARY");
  });

  it("response is JSON", async () => {
    const res = await POST(makePostRequest(VALID_BODY));
    // NextResponse.json sets content-type
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("response contains full document structure", async () => {
    const res = await POST(makePostRequest(VALID_BODY));
    const body = await res.json();
    const doc = body.document;
    expect(doc).toHaveProperty("templateId");
    expect(doc).toHaveProperty("templateName");
    expect(doc).toHaveProperty("article");
    expect(doc).toHaveProperty("content");
    expect(doc).toHaveProperty("generatedAt");
    expect(doc).toHaveProperty("wordCount");
    expect(doc).toHaveProperty("disclaimer");
  });
});

// ============================================================================
// R5: POST — ERROR HANDLING
// ============================================================================

describe("R5: POST — Error Handling", () => {
  it("ANTHROPIC_API_KEY error returns 503", async () => {
    mockGenerateDocument.mockRejectedValue(new Error("ANTHROPIC_API_KEY is not configured. Set it in .env.local"));
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("API key not configured");
  });

  it("generic Error returns 500", async () => {
    mockGenerateDocument.mockRejectedValue(new Error("Claude API timeout"));
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Generation failed");
    expect(body.error).toContain("Claude API timeout");
  });

  it("non-Error throw returns 500 with generic message", async () => {
    mockGenerateDocument.mockRejectedValue("string_error");
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Unknown error occurred");
  });

  it("EXEC_SUMMARY error still triggers error handler", async () => {
    mockGenerateExecutiveSummary.mockRejectedValue(new Error("Summary generation failed"));
    const res = await POST(makePostRequest({ ...VALID_BODY, templateId: "EXEC_SUMMARY" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Summary generation failed");
  });

  it("error response is JSON with error key", async () => {
    mockGenerateDocument.mockRejectedValue(new Error("test error"));
    const res = await POST(makePostRequest(VALID_BODY));
    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(typeof body.error).toBe("string");
  });

  it("503 response includes setup instructions", async () => {
    mockGenerateDocument.mockRejectedValue(new Error("ANTHROPIC_API_KEY missing"));
    const res = await POST(makePostRequest(VALID_BODY));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain(".env.local");
  });
});

// ============================================================================
// R6: GET — QUERY PARAMS VALIDATION
// ============================================================================

describe("R6: GET — Query Params Validation", () => {
  it("returns 400 when classification is missing", async () => {
    const res = await GET(makeGetRequest({ role: "PROVIDER" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Missing query params");
  });

  it("returns 400 when role is missing", async () => {
    const res = await GET(makeGetRequest({ classification: "HIGH_RISK" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when both params are missing", async () => {
    const res = await GET(makeGetRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 200 with valid params", async () => {
    const res = await GET(makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" }));
    expect(res.status).toBe(200);
  });

  it("passes classification and role to getApplicableTemplates", async () => {
    await GET(makeGetRequest({ classification: "GPAI", role: "PROVIDER" }));
    expect(mockGetApplicableTemplates).toHaveBeenCalledWith(
      expect.objectContaining({ classification: "GPAI", role: "PROVIDER" })
    );
  });

  it("does not require authentication", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_realkey123";
    const res = await GET(makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" }));
    expect(res.status).toBe(200);
    // GET does NOT call auth()
    expect(mockAuth).not.toHaveBeenCalled();
  });
});

// ============================================================================
// R7: GET — RESPONSE SHAPE & CORRECTNESS
// ============================================================================

describe("R7: GET — Response Shape & Correctness", () => {
  it("response has templates array", async () => {
    const res = await GET(makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" }));
    const body = await res.json();
    expect(body).toHaveProperty("templates");
    expect(Array.isArray(body.templates)).toBe(true);
  });

  it("each template has id field", async () => {
    mockGetApplicableTemplates.mockReturnValue(["TMPL_RISK_MANAGEMENT"]);
    const res = await GET(makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" }));
    const body = await res.json();
    for (const tmpl of body.templates) {
      expect(tmpl).toHaveProperty("id");
    }
  });

  it("each template merges registry data", async () => {
    mockGetApplicableTemplates.mockReturnValue(["TMPL_RISK_MANAGEMENT"]);
    const res = await GET(makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" }));
    const body = await res.json();
    const tmpl = body.templates[0];
    expect(tmpl.id).toBe("TMPL_RISK_MANAGEMENT");
    expect(tmpl.name).toBe(TEMPLATE_REGISTRY["TMPL_RISK_MANAGEMENT"].name);
    expect(tmpl.articles).toEqual(TEMPLATE_REGISTRY["TMPL_RISK_MANAGEMENT"].articles);
    expect(tmpl.description).toBe(TEMPLATE_REGISTRY["TMPL_RISK_MANAGEMENT"].description);
  });

  it("returns correct number of templates", async () => {
    mockGetApplicableTemplates.mockReturnValue(["TMPL_RISK_MANAGEMENT", "TMPL_QMS", "TMPL_DATA_GOVERNANCE"]);
    const res = await GET(makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" }));
    const body = await res.json();
    expect(body.templates).toHaveLength(3);
  });

  it("returns empty array when no templates match", async () => {
    mockGetApplicableTemplates.mockReturnValue([]);
    const res = await GET(makeGetRequest({ classification: "PROHIBITED", role: "PROVIDER" }));
    const body = await res.json();
    expect(body.templates).toEqual([]);
  });

  it("response is JSON", async () => {
    const res = await GET(makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" }));
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("template has estimatedMinutes field", async () => {
    mockGetApplicableTemplates.mockReturnValue(["TMPL_RISK_MANAGEMENT"]);
    const res = await GET(makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" }));
    const body = await res.json();
    expect(body.templates[0]).toHaveProperty("estimatedMinutes");
    expect(typeof body.templates[0].estimatedMinutes).toBe("number");
  });

  it("template has requiredFor field", async () => {
    mockGetApplicableTemplates.mockReturnValue(["TMPL_RISK_MANAGEMENT"]);
    const res = await GET(makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" }));
    const body = await res.json();
    expect(body.templates[0]).toHaveProperty("requiredFor");
    expect(Array.isArray(body.templates[0].requiredFor)).toBe(true);
  });
});

// ============================================================================
// R8: MIDDLEWARE AUTH LOGIC
// ============================================================================

describe("R8: Middleware Auth Logic", () => {
  it("middleware module exports a default function", async () => {
    // We import the module — it evaluates at import time based on env
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    // Re-import to test the module-level logic
    const middleware = await import("../../middleware");
    expect(typeof middleware.default).toBe("function");
  });

  it("middleware config has matcher patterns", async () => {
    const middleware = await import("../../middleware");
    expect(middleware.config).toBeDefined();
    expect(middleware.config.matcher).toBeDefined();
    expect(Array.isArray(middleware.config.matcher)).toBe(true);
    expect(middleware.config.matcher.length).toBeGreaterThan(0);
  });

  it("middleware config matcher includes API routes", async () => {
    const middleware = await import("../../middleware");
    const matchers = middleware.config.matcher;
    const hasApiMatcher = matchers.some((m: string) => m.includes("api"));
    expect(hasApiMatcher).toBe(true);
  });

  it("middleware config matcher skips static files", async () => {
    const middleware = await import("../../middleware");
    const matchers = middleware.config.matcher;
    // First matcher pattern should exclude static file extensions
    const staticPattern = matchers[0];
    expect(staticPattern).toContain("_next");
  });

  it("middleware is exported as default", async () => {
    const middleware = await import("../../middleware");
    expect(middleware.default).toBeDefined();
  });

  it("middleware config has at least 2 matchers", async () => {
    const middleware = await import("../../middleware");
    expect(middleware.config.matcher.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// R9: EXPORTS & CONFIG
// ============================================================================

describe("R9: Exports & Config", () => {
  it("maxDuration is exported and set to 60", () => {
    expect(maxDuration).toBe(60);
  });

  it("POST is exported as async function", () => {
    expect(typeof POST).toBe("function");
  });

  it("GET is exported as async function", () => {
    expect(typeof GET).toBe("function");
  });
});

// ============================================================================
// R10: EDGE CASES & ADVERSARIAL INPUTS
// ============================================================================

describe("R10: Edge Cases & Adversarial Inputs", () => {
  it("very long companyName is accepted", async () => {
    const longName = "A".repeat(10000);
    const res = await POST(makePostRequest({ ...VALID_BODY, companyName: longName }));
    expect(res.status).toBe(200);
    expect(mockGenerateDocument).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      longName,
      expect.any(String)
    );
  });

  it("very long systemDescription is accepted", async () => {
    const longDesc = "B".repeat(10000);
    const res = await POST(makePostRequest({ ...VALID_BODY, systemDescription: longDesc }));
    expect(res.status).toBe(200);
  });

  it("special characters in companyName are passed through", async () => {
    const specialName = "Compañía <script>alert('xss')</script> & Co. 日本語";
    const res = await POST(makePostRequest({ ...VALID_BODY, companyName: specialName }));
    expect(res.status).toBe(200);
    expect(mockGenerateDocument).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      specialName,
      expect.any(String)
    );
  });

  it("template with SQL injection pattern returns 400", async () => {
    const res = await POST(makePostRequest({
      ...VALID_BODY,
      templateId: "'; DROP TABLE templates; --",
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Unknown template");
  });

  it("GET with extra query params works normally", async () => {
    const req = makeGetRequest({ classification: "HIGH_RISK", role: "PROVIDER" });
    const url = new URL(req.url);
    url.searchParams.set("extraParam", "ignored");
    const res = await GET(new NextRequest(url.toString(), { method: "GET" }));
    expect(res.status).toBe(200);
  });

  it("POST with null values returns 400", async () => {
    const res = await POST(makePostRequest({
      templateId: null,
      result: null,
      companyName: null,
      systemDescription: null,
    }));
    expect(res.status).toBe(400);
  });

  it("all 36 registry templates pass template validation", async () => {
    const templateIds = Object.keys(TEMPLATE_REGISTRY);
    for (const id of templateIds) {
      const res = await POST(makePostRequest({ ...VALID_BODY, templateId: id }));
      expect(res.status).toBe(200);
    }
  });

  it("GET with classification=PROHIBITED returns empty templates", async () => {
    mockGetApplicableTemplates.mockReturnValue([]);
    const res = await GET(makeGetRequest({ classification: "PROHIBITED", role: "PROVIDER" }));
    const body = await res.json();
    expect(body.templates).toEqual([]);
  });

  it("concurrent POST requests are handled independently", async () => {
    const requests = Array.from({ length: 5 }, (_, i) =>
      POST(makePostRequest({ ...VALID_BODY, companyName: `Company${i}` }))
    );
    const responses = await Promise.all(requests);
    for (const res of responses) {
      expect(res.status).toBe(200);
    }
    expect(mockGenerateDocument).toHaveBeenCalledTimes(5);
  });

  it("GET passes classification string as-is (no enum validation at route level)", async () => {
    mockGetApplicableTemplates.mockReturnValue([]);
    const res = await GET(makeGetRequest({ classification: "TOTALLY_INVALID", role: "WHATEVER" }));
    // Route doesn't validate enum values — it trusts the layer below
    expect(res.status).toBe(200);
    expect(mockGetApplicableTemplates).toHaveBeenCalledWith(
      expect.objectContaining({ classification: "TOTALLY_INVALID", role: "WHATEVER" })
    );
  });
});
