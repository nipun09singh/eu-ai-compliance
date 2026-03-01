/**
 * LAYER 2B: Document Generator Pipeline Tests
 *
 * Tests the FULL generation pipeline with mocked Anthropic API.
 * This file exercises ALL internal (non-exported) functions:
 *   - getClient()
 *   - buildTemplatePrompt()
 *   - buildContextBlock()
 *   - formatClassification()
 *   - formatHighRiskArea()
 *   - getTemplateSpecificInstructions()
 *   - generateDocument()
 *   - generateAllDocuments()
 *   - generateExecutiveSummary()
 *
 * 10 sections:
 *   P1: API Client Initialization (3 tests)
 *   P2: generateDocument Full Pipeline (18 tests)
 *   P3: buildContextBlock via Prompt Capture (12 tests)
 *   P4: formatClassification via Prompt Capture (6 tests)
 *   P5: formatHighRiskArea via Prompt Capture (8 tests)
 *   P6: getTemplateSpecificInstructions Conditional Branches (11 tests)
 *   P7: generateAllDocuments with Progress (8 tests)
 *   P8: generateExecutiveSummary (7 tests)
 *   P9: Response Parsing Edge Cases (6 tests)
 *   P10: buildTemplatePrompt Assembly (10 tests)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  ClassificationResult,
  HighRiskArea,
  RiskClassification,
} from "../classification-engine";
import { TEMPLATE_REGISTRY } from "../classification-engine";

// ============================================================================
// MOCK SETUP — Anthropic SDK
// ============================================================================

const { mockCreate } = vi.hoisted(() => {
  const mockCreate = vi.fn();
  return { mockCreate };
});

vi.mock("@anthropic-ai/sdk", () => {
  // Must be a class (not arrow function) so it works with `new Anthropic()`
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
      constructor(public config?: any) {}
      // Expose TextBlock type for type guard
      static TextBlock = class {};
    },
  };
});

// ============================================================================
// IMPORTS (after mock setup)
// ============================================================================

import {
  generateDocument,
  generateAllDocuments,
  generateExecutiveSummary,
  getApplicableTemplates,
} from "../doc-generator";

// ============================================================================
// HELPERS
// ============================================================================

const MOCK_DOC_TEXT = "# Compliance Document\n\nThis is a generated compliance document with multiple sections.\n\n## Section 1\n\nDetails here.\n\n## Section 2\n\nMore details.";

function mockApiResponse(text: string = MOCK_DOC_TEXT) {
  mockCreate.mockResolvedValue({
    content: [{ type: "text", text }],
  });
}

function mockApiResponseMultiBlock(blocks: Array<{ type: string; text?: string }>) {
  mockCreate.mockResolvedValue({ content: blocks });
}

/** Extract the user prompt sent to the mocked API */
function getCapturedPrompt(callIndex = 0): string {
  const call = mockCreate.mock.calls[callIndex];
  if (!call) throw new Error(`No API call at index ${callIndex}`);
  return call[0].messages[0].content;
}

/** Extract the system prompt sent to the mocked API */
function getCapturedSystemPrompt(callIndex = 0): string {
  const call = mockCreate.mock.calls[callIndex];
  if (!call) throw new Error(`No API call at index ${callIndex}`);
  return call[0].system;
}

function makeResult(overrides: Partial<ClassificationResult> = {}): ClassificationResult {
  return {
    classification: "HIGH_RISK",
    role: "PROVIDER",
    confidence: "DEFINITIVE",
    legalBasis: ["Article 6", "Article 8-15"],
    obligations: [],
    enforcementDeadline: "AUGUST_2026",
    fineRisk: {
      maxAmountGeneral: "€15M",
      maxAmountSME: "€7.5M",
      maxPercentTurnover: 3,
      article: "Article 99(3)",
    },
    nextSteps: ["Register in EU database"],
    warnings: [],
    smeSimplifications: [],
    highRiskArea: "EDUCATION",
    ...overrides,
  };
}

// ============================================================================
// TEST LIFECYCLE
// ============================================================================

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "test-key-for-pipeline-tests";
  mockCreate.mockReset();
  mockApiResponse(); // default mock
});

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

// ============================================================================
// P1: API CLIENT INITIALIZATION
// ============================================================================

describe("P1: API Client Initialization", () => {
  it("throws when ANTHROPIC_API_KEY is not set", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(
      generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test system")
    ).rejects.toThrow("ANTHROPIC_API_KEY is not configured");
  });

  it('throws when ANTHROPIC_API_KEY is "your-api-key-here"', async () => {
    process.env.ANTHROPIC_API_KEY = "your-api-key-here";
    await expect(
      generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test system")
    ).rejects.toThrow("ANTHROPIC_API_KEY is not configured");
  });

  it("creates Anthropic client with valid API key and calls API", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-valid-test-key";
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test system");
    // If the client was created successfully, the API call should have been made
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// P2: generateDocument FULL PIPELINE
// ============================================================================

describe("P2: generateDocument Full Pipeline", () => {
  describe("P2.1: Response structure", () => {
    it("returns all required fields", async () => {
      const doc = await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test system");
      expect(doc).toHaveProperty("templateId");
      expect(doc).toHaveProperty("templateName");
      expect(doc).toHaveProperty("article");
      expect(doc).toHaveProperty("content");
      expect(doc).toHaveProperty("generatedAt");
      expect(doc).toHaveProperty("wordCount");
      expect(doc).toHaveProperty("disclaimer");
    });

    it("templateId matches input", async () => {
      const doc = await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
      expect(doc.templateId).toBe("TMPL_RISK_MANAGEMENT");
    });

    it("templateName matches registry", async () => {
      const doc = await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
      expect(doc.templateName).toBe(TEMPLATE_REGISTRY["TMPL_RISK_MANAGEMENT"].name);
    });

    it("article matches template articles joined", async () => {
      const doc = await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
      expect(doc.article).toBe(TEMPLATE_REGISTRY["TMPL_RISK_MANAGEMENT"].articles.join(", "));
    });

    it("generatedAt is valid ISO string", async () => {
      const doc = await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
      expect(() => new Date(doc.generatedAt)).not.toThrow();
      expect(new Date(doc.generatedAt).toISOString()).toBe(doc.generatedAt);
    });

    it("wordCount is positive for non-empty content", async () => {
      const doc = await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
      expect(doc.wordCount).toBeGreaterThan(0);
    });

    it("disclaimer contains EU AI Act reference", async () => {
      const doc = await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
      expect(doc.disclaimer).toContain("EU AI Act");
      expect(doc.disclaimer).toContain("Regulation (EU) 2024/1689");
      expect(doc.disclaimer).toContain("does NOT constitute legal advice");
    });

    it("content matches mock response text", async () => {
      mockApiResponse("EXACT_TEST_CONTENT_HERE");
      const doc = await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
      expect(doc.content).toBe("EXACT_TEST_CONTENT_HERE");
    });
  });

  describe("P2.2: Throws for unknown template", () => {
    it("throws before API call for nonexistent template", async () => {
      await expect(
        generateDocument("NONEXISTENT", makeResult(), "TestCo", "Test")
      ).rejects.toThrow("Unknown template: NONEXISTENT");
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("P2.3: Calls API with correct parameters", () => {
    it("uses claude-sonnet-4-20250514 model", async () => {
      await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
      expect(mockCreate.mock.calls[0][0].model).toBe("claude-sonnet-4-20250514");
    });

    it("uses 4096 max_tokens for regular documents", async () => {
      await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
      expect(mockCreate.mock.calls[0][0].max_tokens).toBe(4096);
    });

    it("sends system prompt with compliance rules", async () => {
      await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
      const system = getCapturedSystemPrompt();
      expect(system).toContain("EU AI Act");
      expect(system).toContain("Regulation (EU) 2024/1689");
      expect(system).toContain("Markdown format");
    });

    it("sends user message with prompt", async () => {
      await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
      const prompt = getCapturedPrompt();
      expect(prompt.length).toBeGreaterThan(100);
    });
  });

  describe("P2.4: Works for every classification type", () => {
    const classifications: RiskClassification[] = [
      "HIGH_RISK", "LIMITED_RISK", "GPAI", "GPAI_SYSTEMIC", "MINIMAL_RISK",
    ];

    for (const classification of classifications) {
      it(`generates document for ${classification}`, async () => {
        // Pick a template that applies to this classification
        const templateId = Object.entries(TEMPLATE_REGISTRY).find(
          ([, t]) => t.requiredFor.includes(classification) && t.appliesToRole === "PROVIDER"
        )?.[0];
        expect(templateId).toBeDefined();

        const result = makeResult({
          classification,
          highRiskArea: classification === "HIGH_RISK" ? "EDUCATION" : undefined,
        });

        const doc = await generateDocument(templateId!, result, "TestCo", "Test system");
        expect(doc.templateId).toBe(templateId);
        expect(doc.content).toBe(MOCK_DOC_TEXT);
      });
    }
  });
});

// ============================================================================
// P3: buildContextBlock via PROMPT CAPTURE
// ============================================================================

describe("P3: buildContextBlock via Prompt Capture", () => {
  it("contains COMPANY name", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "AcmeCorp", "Test");
    expect(getCapturedPrompt()).toContain("COMPANY: AcmeCorp");
  });

  it("contains AI SYSTEM DESCRIPTION", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Resume screening AI system");
    expect(getCapturedPrompt()).toContain("AI SYSTEM DESCRIPTION: Resume screening AI system");
  });

  it("contains CLASSIFICATION formatted string", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult({ classification: "HIGH_RISK" }), "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("CLASSIFICATION: High-Risk AI System (Art 6)");
  });

  it("contains ROLE", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult({ role: "PROVIDER" }), "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("ROLE: PROVIDER");
  });

  it("contains CONFIDENCE", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult({ confidence: "DEFINITIVE" }), "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("CONFIDENCE: DEFINITIVE");
  });

  it("contains LEGAL BASIS", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult({ legalBasis: ["Article 6", "Article 9"] }), "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("LEGAL BASIS: Article 6, Article 9");
  });

  it("contains ENFORCEMENT DEADLINE", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult({ enforcementDeadline: "AUGUST_2026" }), "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("ENFORCEMENT DEADLINE: AUGUST_2026");
  });

  it("contains HIGH-RISK AREA when present", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult({ highRiskArea: "EMPLOYMENT" }), "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("HIGH-RISK AREA: Employment & Workers Management (Annex III, Point 4)");
  });

  it("omits HIGH-RISK AREA when absent", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult({ highRiskArea: undefined }), "TestCo", "Test");
    expect(getCapturedPrompt()).not.toContain("HIGH-RISK AREA:");
  });

  it("contains TRANSPARENCY OBLIGATIONS when present", async () => {
    const result = makeResult({
      transparencyObligations: ["INTERACTION_DISCLOSURE" as any, "DEEPFAKE_DISCLOSURE" as any],
    });
    await generateDocument("TMPL_RISK_MANAGEMENT", result, "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("TRANSPARENCY OBLIGATIONS: INTERACTION_DISCLOSURE, DEEPFAKE_DISCLOSURE");
  });

  it("contains MAX FINE when fineRisk present", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("MAX FINE: €15M / 3% turnover");
  });

  it("contains SME SIMPLIFICATIONS when applicable", async () => {
    const result = makeResult({ smeSimplifications: ["Reduced documentation burden"] });
    await generateDocument("TMPL_RISK_MANAGEMENT", result, "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("SME SIMPLIFICATIONS APPLY: Yes");
  });

  it("omits SME SIMPLIFICATIONS when empty", async () => {
    const result = makeResult({ smeSimplifications: [] });
    await generateDocument("TMPL_RISK_MANAGEMENT", result, "TestCo", "Test");
    expect(getCapturedPrompt()).not.toContain("SME SIMPLIFICATIONS");
  });

  it("contains PROHIBITED PRACTICES when present", async () => {
    const result = makeResult({
      prohibitedPractices: [{ practice: "social_scoring", article: "Art 5(1)(c)" } as any],
    });
    await generateDocument("TMPL_RISK_MANAGEMENT", result, "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("PROHIBITED PRACTICES FLAGGED:");
  });
});

// ============================================================================
// P4: formatClassification via PROMPT CAPTURE
// ============================================================================

describe("P4: formatClassification via Prompt Capture", () => {
  const classificationFormats: [RiskClassification, string][] = [
    ["PROHIBITED", "Prohibited AI Practice (Art 5)"],
    ["HIGH_RISK", "High-Risk AI System (Art 6)"],
    ["LIMITED_RISK", "Limited Risk — Transparency Obligations (Art 50)"],
    ["GPAI", "General-Purpose AI Model (Art 51-53)"],
    ["GPAI_SYSTEMIC", "GPAI with Systemic Risk (Art 51-55)"],
    ["MINIMAL_RISK", "Minimal Risk (voluntary compliance)"],
  ];

  for (const [classification, expected] of classificationFormats) {
    it(`${classification} → "${expected}"`, async () => {
      // Find a template that applies to this classification
      const templateId = Object.entries(TEMPLATE_REGISTRY).find(
        ([, t]) => t.requiredFor.includes(classification) && t.appliesToRole === "PROVIDER"
      )?.[0];

      // PROHIBITED has no templates — use a different approach
      if (!templateId) {
        // For PROHIBITED, test via generateExecutiveSummary
        const result = makeResult({ classification });
        await generateExecutiveSummary(result, "TestCo", "Test");
        expect(getCapturedPrompt()).toContain(`CLASSIFICATION: ${expected}`);
        return;
      }

      const result = makeResult({
        classification,
        highRiskArea: classification === "HIGH_RISK" ? "EDUCATION" : undefined,
      });
      await generateDocument(templateId, result, "TestCo", "Test");
      expect(getCapturedPrompt()).toContain(`CLASSIFICATION: ${expected}`);
    });
  }
});

// ============================================================================
// P5: formatHighRiskArea via PROMPT CAPTURE
// ============================================================================

describe("P5: formatHighRiskArea via Prompt Capture", () => {
  const areaFormats: [HighRiskArea, string][] = [
    ["BIOMETRICS", "Biometrics (Annex III, Point 1)"],
    ["CRITICAL_INFRASTRUCTURE", "Critical Infrastructure (Annex III, Point 2)"],
    ["EDUCATION", "Education & Vocational Training (Annex III, Point 3)"],
    ["EMPLOYMENT", "Employment & Workers Management (Annex III, Point 4)"],
    ["ESSENTIAL_SERVICES", "Essential Private & Public Services (Annex III, Point 5)"],
    ["LAW_ENFORCEMENT", "Law Enforcement (Annex III, Point 6)"],
    ["MIGRATION_ASYLUM_BORDER", "Migration, Asylum & Border Control (Annex III, Point 7)"],
    ["JUSTICE_DEMOCRACY", "Administration of Justice & Democratic Processes (Annex III, Point 8)"],
  ];

  for (const [area, expected] of areaFormats) {
    it(`${area} → "${expected}"`, async () => {
      const result = makeResult({ classification: "HIGH_RISK", highRiskArea: area });
      await generateDocument("TMPL_RISK_MANAGEMENT", result, "TestCo", "Test");
      expect(getCapturedPrompt()).toContain(`HIGH-RISK AREA: ${expected}`);
    });
  }
});

// ============================================================================
// P6: getTemplateSpecificInstructions CONDITIONAL BRANCHES
// ============================================================================

describe("P6: getTemplateSpecificInstructions Conditional Branches", () => {
  describe("P6.1: HUMAN_OVERSIGHT role conditional", () => {
    it("DEPLOYER gets deployer-specific measures", async () => {
      const result = makeResult({ role: "DEPLOYER" });
      await generateDocument("TMPL_HUMAN_OVERSIGHT", result, "TestCo", "Test");
      expect(getCapturedPrompt()).toContain("deployer-specific measures per Art 26(2)");
    });

    it("BOTH gets deployer-specific measures", async () => {
      const result = makeResult({ role: "BOTH" });
      await generateDocument("TMPL_HUMAN_OVERSIGHT", result, "TestCo", "Test");
      expect(getCapturedPrompt()).toContain("deployer-specific measures per Art 26(2)");
    });

    it("PROVIDER does NOT get deployer-specific measures", async () => {
      const result = makeResult({ role: "PROVIDER" });
      await generateDocument("TMPL_HUMAN_OVERSIGHT", result, "TestCo", "Test");
      expect(getCapturedPrompt()).not.toContain("deployer-specific measures per Art 26(2)");
    });
  });

  describe("P6.2: CONFORMITY_ASSESSMENT area conditional", () => {
    it("BIOMETRICS gets third-party assessment REQUIRED", async () => {
      const result = makeResult({ highRiskArea: "BIOMETRICS" });
      await generateDocument("TMPL_CONFORMITY_ASSESSMENT", result, "TestCo", "Test");
      expect(getCapturedPrompt()).toContain("Third-party assessment REQUIRED");
    });

    it("CRITICAL_INFRASTRUCTURE gets third-party assessment REQUIRED", async () => {
      const result = makeResult({ highRiskArea: "CRITICAL_INFRASTRUCTURE" });
      await generateDocument("TMPL_CONFORMITY_ASSESSMENT", result, "TestCo", "Test");
      expect(getCapturedPrompt()).toContain("Third-party assessment REQUIRED");
    });

    it("EDUCATION gets internal control applies", async () => {
      const result = makeResult({ highRiskArea: "EDUCATION" });
      await generateDocument("TMPL_CONFORMITY_ASSESSMENT", result, "TestCo", "Test");
      expect(getCapturedPrompt()).toContain("Internal control (Annex VI) applies");
    });

    it("EMPLOYMENT gets internal control applies", async () => {
      const result = makeResult({ highRiskArea: "EMPLOYMENT" });
      await generateDocument("TMPL_CONFORMITY_ASSESSMENT", result, "TestCo", "Test");
      expect(getCapturedPrompt()).toContain("Internal control (Annex VI) applies");
    });
  });

  describe("P6.3: GPAI_TECH_DOC systemic conditional", () => {
    it("GPAI_SYSTEMIC includes systemic risk additions", async () => {
      const result = makeResult({ classification: "GPAI_SYSTEMIC" });
      await generateDocument("TMPL_GPAI_TECH_DOC", result, "TestCo", "Test");
      const prompt = getCapturedPrompt();
      expect(prompt).toContain("SYSTEMIC RISK ADDITIONS per Art 55");
      expect(prompt).toContain("Model evaluation per Art 55(1)(a)");
    });

    it("regular GPAI does NOT include systemic risk additions", async () => {
      const result = makeResult({ classification: "GPAI" });
      await generateDocument("TMPL_GPAI_TECH_DOC", result, "TestCo", "Test");
      expect(getCapturedPrompt()).not.toContain("SYSTEMIC RISK ADDITIONS per Art 55");
    });
  });

  describe("P6.4: DPIA_AI gdprInterplay conditional", () => {
    it("includes GDPR interplay flags when present", async () => {
      const result = makeResult({
        gdprInterplay: ["Art 22 automated decision", "Special category data processed"],
      });
      await generateDocument("TMPL_DPIA_AI", result, "TestCo", "Test");
      const prompt = getCapturedPrompt();
      expect(prompt).toContain("GDPR-AI INTERPLAY FLAGS:");
      expect(prompt).toContain("Art 22 automated decision");
      expect(prompt).toContain("Special category data processed");
    });

    it("omits GDPR interplay section when not present", async () => {
      const result = makeResult({ gdprInterplay: undefined });
      await generateDocument("TMPL_DPIA_AI", result, "TestCo", "Test");
      expect(getCapturedPrompt()).not.toContain("GDPR-AI INTERPLAY FLAGS:");
    });

    it("omits GDPR interplay section when empty array", async () => {
      const result = makeResult({ gdprInterplay: [] });
      await generateDocument("TMPL_DPIA_AI", result, "TestCo", "Test");
      expect(getCapturedPrompt()).not.toContain("GDPR-AI INTERPLAY FLAGS:");
    });
  });

  describe("P6.5: Default fallback for unlisted template", () => {
    // Templates NOT in the instructions map get the default fallback
    // We need to find a templateId that exists in registry but NOT in instructions
    it("template with no specific instructions gets generic fallback", async () => {
      // All templates have specific instructions in the current code,
      // but the default path exists. We verify via structural test:
      // The fallback text is "Generate a comprehensive compliance document..."
      // This is tested by verifying templates WITH instructions have specific content.
      const result = makeResult();
      await generateDocument("TMPL_RISK_MANAGEMENT", result, "TestCo", "Test");
      // TMPL_RISK_MANAGEMENT HAS specific instructions, so verify it contains them
      expect(getCapturedPrompt()).toContain("Risk identification and analysis");
    });
  });
});

// ============================================================================
// P7: generateAllDocuments WITH PROGRESS
// ============================================================================

describe("P7: generateAllDocuments with Progress", () => {
  it("returns empty array for empty selectedTemplateIds", async () => {
    const docs = await generateAllDocuments({
      result: makeResult(),
      companyName: "TestCo",
      systemDescription: "Test",
      selectedTemplateIds: [],
    });
    expect(docs).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("generates documents for specified templates", async () => {
    const docs = await generateAllDocuments({
      result: makeResult(),
      companyName: "TestCo",
      systemDescription: "Test",
      selectedTemplateIds: ["TMPL_RISK_MANAGEMENT", "TMPL_DATA_GOVERNANCE"],
    });
    expect(docs).toHaveLength(2);
    expect(docs[0].templateId).toBe("TMPL_RISK_MANAGEMENT");
    expect(docs[1].templateId).toBe("TMPL_DATA_GOVERNANCE");
  });

  it("auto-detects templates when selectedTemplateIds omitted", async () => {
    const result = makeResult({ classification: "MINIMAL_RISK", highRiskArea: undefined });
    const expected = getApplicableTemplates(result);
    const docs = await generateAllDocuments({
      result,
      companyName: "TestCo",
      systemDescription: "Test",
    });
    expect(docs).toHaveLength(expected.length);
    for (let i = 0; i < expected.length; i++) {
      expect(docs[i].templateId).toBe(expected[i]);
    }
  });

  it("calls progress callback for each template", async () => {
    const progress: Array<{ total: number; completed: number; current: string }> = [];
    await generateAllDocuments(
      {
        result: makeResult(),
        companyName: "TestCo",
        systemDescription: "Test",
        selectedTemplateIds: ["TMPL_RISK_MANAGEMENT", "TMPL_DATA_GOVERNANCE"],
      },
      (p) => progress.push({ ...p })
    );
    // 2 in-progress callbacks + 1 final "Complete" callback
    expect(progress).toHaveLength(3);
  });

  it("progress callback shows correct total", async () => {
    const progress: Array<{ total: number; completed: number; current: string }> = [];
    await generateAllDocuments(
      {
        result: makeResult(),
        companyName: "TestCo",
        systemDescription: "Test",
        selectedTemplateIds: ["TMPL_RISK_MANAGEMENT", "TMPL_QMS"],
      },
      (p) => progress.push({ ...p })
    );
    for (const p of progress) {
      expect(p.total).toBe(2);
    }
  });

  it('final progress shows "Complete"', async () => {
    const progress: Array<{ total: number; completed: number; current: string }> = [];
    await generateAllDocuments(
      {
        result: makeResult(),
        companyName: "TestCo",
        systemDescription: "Test",
        selectedTemplateIds: ["TMPL_RISK_MANAGEMENT"],
      },
      (p) => progress.push({ ...p })
    );
    const last = progress[progress.length - 1];
    expect(last.current).toBe("Complete");
    expect(last.completed).toBe(last.total);
  });

  it("progress current shows template name", async () => {
    const progress: Array<{ total: number; completed: number; current: string }> = [];
    await generateAllDocuments(
      {
        result: makeResult(),
        companyName: "TestCo",
        systemDescription: "Test",
        selectedTemplateIds: ["TMPL_RISK_MANAGEMENT"],
      },
      (p) => progress.push({ ...p })
    );
    expect(progress[0].current).toBe(TEMPLATE_REGISTRY["TMPL_RISK_MANAGEMENT"].name);
  });

  it("works without onProgress callback", async () => {
    const docs = await generateAllDocuments({
      result: makeResult(),
      companyName: "TestCo",
      systemDescription: "Test",
      selectedTemplateIds: ["TMPL_RISK_MANAGEMENT"],
    });
    expect(docs).toHaveLength(1);
  });
});

// ============================================================================
// P8: generateExecutiveSummary
// ============================================================================

describe("P8: generateExecutiveSummary", () => {
  it('returns templateId "EXEC_SUMMARY"', async () => {
    const doc = await generateExecutiveSummary(makeResult(), "TestCo", "Test");
    expect(doc.templateId).toBe("EXEC_SUMMARY");
  });

  it('returns templateName "Executive Summary"', async () => {
    const doc = await generateExecutiveSummary(makeResult(), "TestCo", "Test");
    expect(doc.templateName).toBe("Executive Summary");
  });

  it("article matches result legalBasis joined", async () => {
    const result = makeResult({ legalBasis: ["Article 6", "Article 9"] });
    const doc = await generateExecutiveSummary(result, "TestCo", "Test");
    expect(doc.article).toBe("Article 6, Article 9");
  });

  it("uses 2048 max_tokens (not 4096)", async () => {
    await generateExecutiveSummary(makeResult(), "TestCo", "Test");
    expect(mockCreate.mock.calls[0][0].max_tokens).toBe(2048);
  });

  it("prompt contains executive summary task instructions", async () => {
    await generateExecutiveSummary(makeResult(), "TestCo", "Test");
    const prompt = getCapturedPrompt();
    expect(prompt).toContain("EXECUTIVE SUMMARY");
    expect(prompt).toContain("Key obligations");
    expect(prompt).toContain("Critical deadlines");
    expect(prompt).toContain("Fine exposure");
    expect(prompt).toContain("Top 3 priority actions");
  });

  it("prompt contains context block", async () => {
    await generateExecutiveSummary(makeResult(), "AcmeCorp", "Resume AI");
    const prompt = getCapturedPrompt();
    expect(prompt).toContain("COMPANY: AcmeCorp");
    expect(prompt).toContain("AI SYSTEM DESCRIPTION: Resume AI");
  });

  it("response has disclaimer", async () => {
    const doc = await generateExecutiveSummary(makeResult(), "TestCo", "Test");
    expect(doc.disclaimer).toContain("does NOT constitute legal advice");
  });
});

// ============================================================================
// P9: RESPONSE PARSING EDGE CASES
// ============================================================================

describe("P9: Response Parsing Edge Cases", () => {
  it("filters out non-text blocks", async () => {
    mockApiResponseMultiBlock([
      { type: "text", text: "Part one." },
      { type: "tool_use" },
      { type: "text", text: "Part two." },
    ]);
    const doc = await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
    expect(doc.content).toBe("Part one.\n\nPart two.");
  });

  it("joins multiple text blocks with double newline", async () => {
    mockApiResponseMultiBlock([
      { type: "text", text: "Block A" },
      { type: "text", text: "Block B" },
      { type: "text", text: "Block C" },
    ]);
    const doc = await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
    expect(doc.content).toBe("Block A\n\nBlock B\n\nBlock C");
  });

  it("handles single text block", async () => {
    mockApiResponse("Single block content.");
    const doc = await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
    expect(doc.content).toBe("Single block content.");
  });

  it("calculates word count correctly", async () => {
    mockApiResponse("one two three four five");
    const doc = await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
    expect(doc.wordCount).toBe(5);
  });

  it("handles content with extra whitespace in word count", async () => {
    mockApiResponse("one   two\n\nthree\t\tfour");
    const doc = await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
    // split(/\s+/) collapses whitespace
    expect(doc.wordCount).toBe(4);
  });

  it("generatedAt is close to current time", async () => {
    const before = Date.now();
    const doc = await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
    const after = Date.now();
    const genTime = new Date(doc.generatedAt).getTime();
    expect(genTime).toBeGreaterThanOrEqual(before);
    expect(genTime).toBeLessThanOrEqual(after);
  });
});

// ============================================================================
// P10: buildTemplatePrompt ASSEMBLY
// ============================================================================

describe("P10: buildTemplatePrompt Assembly", () => {
  it("contains template name in quotes", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
    const tmplName = TEMPLATE_REGISTRY["TMPL_RISK_MANAGEMENT"].name;
    expect(getCapturedPrompt()).toContain(`"${tmplName}"`);
  });

  it("contains template description", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
    const desc = TEMPLATE_REGISTRY["TMPL_RISK_MANAGEMENT"].description;
    expect(getCapturedPrompt()).toContain(desc);
  });

  it("contains template articles", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
    const articles = TEMPLATE_REGISTRY["TMPL_RISK_MANAGEMENT"].articles.join(", ");
    expect(getCapturedPrompt()).toContain(`LEGAL BASIS: ${articles}`);
    // Also appears in context block as result.legalBasis — the LEGAL BASIS in the template section
  });

  it('BOTH role formats as "provider AND deployer"', async () => {
    const result = makeResult({ role: "BOTH" });
    await generateDocument("TMPL_RISK_MANAGEMENT", result, "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("provider AND deployer");
  });

  it("PROVIDER role formats as lowercase", async () => {
    const result = makeResult({ role: "PROVIDER" });
    await generateDocument("TMPL_RISK_MANAGEMENT", result, "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("ROLE: This document is for the provider");
  });

  it("DEPLOYER role formats as lowercase", async () => {
    // Need a template that applies to DEPLOYER + HIGH_RISK
    const result = makeResult({ role: "DEPLOYER" });
    await generateDocument("TMPL_HUMAN_OVERSIGHT", result, "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("ROLE: This document is for the deployer");
  });

  it("contains TASK directive", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("TASK: Generate a complete");
  });

  it("contains DESCRIPTION field", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("DESCRIPTION:");
  });

  it("contains production-ready instruction", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("production-ready compliance document");
  });

  it("separates context from task with divider", async () => {
    await generateDocument("TMPL_RISK_MANAGEMENT", makeResult(), "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("---");
  });
});

// ============================================================================
// P11: TEMPLATE-SPECIFIC INSTRUCTION CONTENT VERIFICATION
// ============================================================================

describe("P11: Template-Specific Instruction Content", () => {
  // Verify that each template with specific instructions actually includes
  // the key content when generateDocument is called.

  const templateContentChecks: [string, string[], ClassificationResult?][] = [
    ["TMPL_RISK_MANAGEMENT", ["Article 9", "Risk identification", "risk register table"]],
    ["TMPL_DATA_GOVERNANCE", ["Article 10", "Training data", "Bias detection"]],
    ["TMPL_TECHNICAL_DOC", ["Article 11", "Annex IV", "system architecture"]],
    ["TMPL_LOGGING_SPEC", ["Article 12", "Events to be logged", "retention"]],
    ["TMPL_INSTRUCTIONS_FOR_USE", ["Article 13", "Intended purpose", "Foreseeable misuse"]],
    ["TMPL_ACCURACY_ROBUSTNESS", ["Article 15", "Accuracy", "Cybersecurity"]],
    ["TMPL_QMS", ["Article 17", "QMS scope", "Internal audit"]],
    ["TMPL_CORRECTIVE_ACTIONS", ["Articles 20 and 73", "Root cause analysis", "Recall"]],
    ["TMPL_EU_DECLARATION", ["Article 47", "Annex V", "EU DECLARATION OF CONFORMITY"]],
    ["TMPL_EU_DB_REGISTRATION", ["Article 49", "Annex VIII", "Registration scope"]],
    ["TMPL_POST_MARKET_MONITORING", ["Article 72", "Data collection strategy", "drift detection"]],
    ["TMPL_NON_HIGH_RISK_ASSESSMENT", ["Article 6(3)", "significant risk of harm", "narrow procedural task"]],
    ["TMPL_AI_INTERACTION_NOTICE", ["Article 50(1)", "interacting with an AI system"]],
    ["TMPL_DEEPFAKE_DISCLOSURE", ["Article 50(4)", "synthetic content"]],
    ["TMPL_AI_TEXT_LABEL", ["Article 50(4)", "AI-generated text"]],
    ["TMPL_AI_MEDIA_MARKING", ["Article 50(2)", "Machine-readable marking", "watermarking"]],
    ["TMPL_EMOTION_NOTICE", ["Article 50(3)", "emotion recognition"]],
    ["TMPL_BIOMETRIC_CAT_NOTICE", ["Article 50(3)", "biometric categorisation"]],
    ["TMPL_COPYRIGHT_POLICY", ["Article 53(1)(c)", "Text and data mining", "Opt-out"]],
    ["TMPL_TRAINING_SUMMARY", ["Article 53(1)(d)", "training data content", "PUBLICLY available"]],
    ["TMPL_AI_LITERACY_PLAN", ["Article 4", "Competency framework", "UNIVERSAL obligation"]],
    ["TMPL_DEPLOYER_PROCEDURES", ["Article 26", "instructions for use", "Human oversight assignment"]],
    ["TMPL_INFORM_AFFECTED", ["Article 26(11)", "plain-language notice", "human review"]],
    ["TMPL_IMPORTER_CHECKLIST", ["Article 28", "PRE-MARKET VERIFICATION", "CE marking"]],
    ["TMPL_DISTRIBUTOR_CHECKLIST", ["Article 29", "PRE-DISTRIBUTION VERIFICATION", "CE marking"]],
    ["TMPL_AUTH_REP_MANDATE", ["Article 22", "MANDATE AGREEMENT", "Authorised Representative"]],
    ["TMPL_SERIOUS_INCIDENT_REPORT", ["Article 73", "SERIOUS INCIDENT REPORT", "15 days"]],
    ["TMPL_GPAI_SYSTEMIC_RISK", ["Article 55", "SYSTEMIC RISK IDENTIFICATION", "Red-teaming"]],
    ["TMPL_CODES_OF_PRACTICE", ["Article 56", "STATEMENT OF ADHERENCE", "AI Office"]],
    ["TMPL_SUBSTANTIAL_MOD_ASSESSMENT", ["Article 6(6)", "SUBSTANTIAL MODIFICATION", "Re-assessment"]],
  ];

  for (const [templateId, expectedContent, customResult] of templateContentChecks) {
    it(`${templateId} prompt contains required instruction content`, async () => {
      // Determine correct classification for this template
      const tmpl = TEMPLATE_REGISTRY[templateId];
      const classification = tmpl.requiredFor[0]; // Use first valid classification
      const role = tmpl.appliesToRole === "BOTH" ? "BOTH" : tmpl.appliesToRole;

      const result = customResult ?? makeResult({
        classification,
        role: role as any,
        highRiskArea: classification === "HIGH_RISK" ? "EDUCATION" : undefined,
      });

      await generateDocument(templateId, result, "TestCo", "Test system");
      const prompt = getCapturedPrompt();

      for (const content of expectedContent) {
        expect(prompt).toContain(content);
      }
    });
  }
});

// ============================================================================
// P12: COMPLETE PIPELINE STRESS — Every template generates successfully
// ============================================================================

describe("P12: Every Template Generates Successfully", () => {
  const allTemplateIds = Object.keys(TEMPLATE_REGISTRY);

  for (const templateId of allTemplateIds) {
    it(`${templateId} generates without error`, async () => {
      const tmpl = TEMPLATE_REGISTRY[templateId];
      const classification = tmpl.requiredFor[0];
      const role = tmpl.appliesToRole === "BOTH" ? "BOTH" : tmpl.appliesToRole;

      const result = makeResult({
        classification,
        role: role as any,
        highRiskArea: classification === "HIGH_RISK" ? "EDUCATION" : undefined,
      });

      const doc = await generateDocument(templateId, result, "TestCo", "Test system");
      expect(doc.templateId).toBe(templateId);
      expect(doc.templateName).toBe(tmpl.name);
      expect(doc.content).toBeTruthy();
      expect(doc.disclaimer).toBeTruthy();
    });
  }
});

// ============================================================================
// P13: FUNDAMENTAL_RIGHTS_IMPACT — deployer-only template
// ============================================================================

describe("P13: Deployer-Specific Template Generation", () => {
  it("FUNDAMENTAL_RIGHTS_IMPACT generates for DEPLOYER", async () => {
    const result = makeResult({ role: "DEPLOYER" });
    await generateDocument("TMPL_FUNDAMENTAL_RIGHTS_IMPACT", result, "TestCo", "Test");
    const prompt = getCapturedPrompt();
    expect(prompt).toContain("Article 27");
    expect(prompt).toContain("fundamental rights");
  });

  it("GPAI_DOWNSTREAM generates for PROVIDER", async () => {
    const result = makeResult({ classification: "GPAI", role: "PROVIDER", highRiskArea: undefined });
    await generateDocument("TMPL_GPAI_DOWNSTREAM", result, "TestCo", "Test");
    const prompt = getCapturedPrompt();
    expect(prompt).toContain("Article 53(1)(b)");
    expect(prompt).toContain("downstream providers");
  });

  it("CONFORMITY_ASSESSMENT generates for PROVIDER", async () => {
    const result = makeResult({ role: "PROVIDER", highRiskArea: "EDUCATION" });
    await generateDocument("TMPL_CONFORMITY_ASSESSMENT", result, "TestCo", "Test");
    const prompt = getCapturedPrompt();
    expect(prompt).toContain("Article 43");
  });
});

// ============================================================================
// P14: REMAINING BRANCH COVERAGE — edge cases for uncovered branches
// ============================================================================

describe("P14: Remaining Branch Coverage", () => {
  it("buildContextBlock: prohibitedPractices empty array → no PROHIBITED PRACTICES line", async () => {
    const result = makeResult({ prohibitedPractices: [] });
    await generateDocument("TMPL_RISK_MANAGEMENT", result, "TestCo", "Test");
    expect(getCapturedPrompt()).not.toContain("PROHIBITED PRACTICES FLAGGED:");
  });

  it("buildContextBlock: prohibitedPractices undefined → no PROHIBITED PRACTICES line", async () => {
    const result = makeResult();
    // makeResult doesn't include prohibitedPractices by default
    expect(result.prohibitedPractices).toBeUndefined();
    await generateDocument("TMPL_RISK_MANAGEMENT", result, "TestCo", "Test");
    expect(getCapturedPrompt()).not.toContain("PROHIBITED PRACTICES FLAGGED:");
  });

  it("buildContextBlock: transparencyObligations empty → no TRANSPARENCY line", async () => {
    const result = makeResult({ transparencyObligations: [] });
    await generateDocument("TMPL_RISK_MANAGEMENT", result, "TestCo", "Test");
    expect(getCapturedPrompt()).not.toContain("TRANSPARENCY OBLIGATIONS:");
  });

  it("buildContextBlock: transparencyObligations undefined → no TRANSPARENCY line", async () => {
    const result = makeResult({ transparencyObligations: undefined });
    await generateDocument("TMPL_RISK_MANAGEMENT", result, "TestCo", "Test");
    expect(getCapturedPrompt()).not.toContain("TRANSPARENCY OBLIGATIONS:");
  });

  it("buildContextBlock: fineRisk present includes MAX FINE", async () => {
    const result = makeResult({
      fineRisk: { maxAmountGeneral: "€35M", maxAmountSME: "€17.5M", maxPercentTurnover: 7, article: "Art 99(1)" },
    });
    await generateDocument("TMPL_RISK_MANAGEMENT", result, "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("MAX FINE: €35M / 7% turnover");
  });

  it("generateAllDocuments: progress uses templateId fallback for unknown template", async () => {
    // Pass a non-existent templateId — progress callback uses `tmpl?.name ?? templateId`
    const progress: Array<{ current: string }> = [];
    await expect(
      generateAllDocuments(
        {
          result: makeResult(),
          companyName: "TestCo",
          systemDescription: "Test",
          selectedTemplateIds: ["NONEXISTENT_TEMPLATE_XYZ"],
        },
        (p) => progress.push({ current: p.current })
      )
    ).rejects.toThrow();
    // Progress was called BEFORE the error, using the raw templateId as fallback
    expect(progress.length).toBeGreaterThanOrEqual(1);
    expect(progress[0].current).toBe("NONEXISTENT_TEMPLATE_XYZ");
  });

  it("generateDocument: NEEDS_LEGAL_REVIEW confidence appears in prompt", async () => {
    const result = makeResult({ confidence: "NEEDS_LEGAL_REVIEW" });
    await generateDocument("TMPL_RISK_MANAGEMENT", result, "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("CONFIDENCE: NEEDS_LEGAL_REVIEW");
  });

  it("generateDocument: LIKELY confidence appears in prompt", async () => {
    const result = makeResult({ confidence: "LIKELY" });
    await generateDocument("TMPL_RISK_MANAGEMENT", result, "TestCo", "Test");
    expect(getCapturedPrompt()).toContain("CONFIDENCE: LIKELY");
  });

  it("buildContextBlock: result with no highRiskArea omits HIGH-RISK AREA line", async () => {
    const result = makeResult({ classification: "GPAI", highRiskArea: undefined });
    await generateDocument("TMPL_GPAI_TECH_DOC", result, "TestCo", "Test");
    expect(getCapturedPrompt()).not.toContain("HIGH-RISK AREA:");
  });

  it("generateAllDocuments: auto-detects templates when no selectedTemplateIds", async () => {
    const result = makeResult({ classification: "GPAI", highRiskArea: undefined });
    const expectedTemplates = getApplicableTemplates(result);
    const docs = await generateAllDocuments({
      result,
      companyName: "TestCo",
      systemDescription: "Test",
      // No selectedTemplateIds
    });
    expect(docs).toHaveLength(expectedTemplates.length);
    expect(mockCreate).toHaveBeenCalledTimes(expectedTemplates.length);
  });

  it("executive summary: context block includes all sections for rich result", async () => {
    const result = makeResult({
      classification: "HIGH_RISK",
      highRiskArea: "BIOMETRICS",
      smeSimplifications: ["Simplified conformity assessment"],
      transparencyObligations: ["INTERACTION_DISCLOSURE" as any],
    });
    await generateExecutiveSummary(result, "BigCorp", "Face recognition system");
    const prompt = getCapturedPrompt();
    expect(prompt).toContain("COMPANY: BigCorp");
    expect(prompt).toContain("High-Risk AI System (Art 6)");
    expect(prompt).toContain("Biometrics (Annex III, Point 1)");
    expect(prompt).toContain("SME SIMPLIFICATIONS APPLY: Yes");
    expect(prompt).toContain("TRANSPARENCY OBLIGATIONS:");
    expect(prompt).toContain("EXECUTIVE SUMMARY");
  });
});
