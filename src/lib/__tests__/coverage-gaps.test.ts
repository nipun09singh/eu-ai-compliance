/**
 * LAYER 5: Coverage Gap Closing Tests
 *
 * Targets the remaining uncovered lines/branches to push coverage to 100%.
 *
 * classification-engine.ts:
 *   GAP-CE1: buildFineRisk("INCORRECT_INFO") — Art 99(5) fine tier (line 2578)
 *   GAP-CE2: Extraterritorial overlay — HIGH_RISK + role BOTH branch (line 1584)
 *   GAP-CE3: Extraterritorial overlay — GPAI_SYSTEMIC non-EU branch (line 1621)
 *   GAP-CE4: Transitional provisions — GPAI_SYSTEMIC already on market (line 1646)
 *
 * doc-generator.ts:
 *   GAP-DG1: generateDocument with invalid template ID (line 134 — throw)
 *   GAP-DG2: buildContextBlock with result missing fineRisk (line 180 — falsy branch)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildFineRisk,
  classifyAISystem,
  TEMPLATE_REGISTRY,
} from "../classification-engine";
import type { ClassificationResult, WizardAnswers } from "../classification-engine";

// ============================================================================
// GAP-CE1: buildFineRisk("INCORRECT_INFO") — direct testing of Art 99(5)
// ============================================================================

describe("GAP-CE1: buildFineRisk — INCORRECT_INFO fine tier (Art 99(5))", () => {
  it("returns correct fine structure for LARGE company", () => {
    const risk = buildFineRisk("INCORRECT_INFO", "LARGE");
    expect(risk.maxAmountGeneral).toBe("€7,500,000");
    expect(risk.maxAmountSME).toBe("€7,500,000");
    expect(risk.maxPercentTurnover).toBe(1);
    expect(risk.article).toBe("Article 99(5)");
  });

  it("returns SME-adjusted fine for MICRO company", () => {
    const risk = buildFineRisk("INCORRECT_INFO", "MICRO");
    expect(risk.maxAmountGeneral).toBe("€7,500,000");
    expect(risk.maxAmountSME).toContain("LOWER");
    expect(risk.maxPercentTurnover).toBe(1);
    expect(risk.article).toBe("Article 99(5)");
  });

  it("returns SME-adjusted fine for SMALL company", () => {
    const risk = buildFineRisk("INCORRECT_INFO", "SMALL");
    expect(risk.maxAmountSME).toContain("LOWER");
    expect(risk.maxAmountSME).toContain("1%");
  });

  it("returns SME-adjusted fine for MEDIUM company", () => {
    const risk = buildFineRisk("INCORRECT_INFO", "MEDIUM");
    expect(risk.maxAmountSME).toContain("LOWER");
  });

  // Comprehensive cross-check: all 5 fine categories × 4 company sizes
  const categories = ["PROHIBITED", "HIGH_RISK", "GPAI", "INCORRECT_INFO", "NONE"] as const;
  const sizes = ["MICRO", "SMALL", "MEDIUM", "LARGE"] as const;

  for (const cat of categories) {
    for (const size of sizes) {
      it(`buildFineRisk("${cat}", "${size}") returns valid structure`, () => {
        const risk = buildFineRisk(cat, size);
        expect(risk).toHaveProperty("maxAmountGeneral");
        expect(risk).toHaveProperty("maxAmountSME");
        expect(risk).toHaveProperty("maxPercentTurnover");
        expect(risk).toHaveProperty("article");
        expect(typeof risk.maxPercentTurnover).toBe("number");
      });
    }
  }
});

// ============================================================================
// MOCK SETUP — Anthropic SDK (for doc-generator tests)
// ============================================================================

const { mockCreate } = vi.hoisted(() => {
  const mockCreate = vi.fn();
  return { mockCreate };
});

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
      constructor(public config?: any) {}
    },
  };
});

import { generateDocument } from "../doc-generator";

const MOCK_DOC_TEXT = "# Gap Test Document\n\nGenerated content.";

function mockApiResponse(text: string = MOCK_DOC_TEXT) {
  mockCreate.mockResolvedValue({
    content: [{ type: "text", text }],
  });
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
    nextSteps: [],
    warnings: [],
    smeSimplifications: [],
    highRiskArea: "EDUCATION",
    ...overrides,
  };
}

// ============================================================================
// GAP-DG1: generateDocument with invalid template ID (line 134 — throw)
// ============================================================================

describe("GAP-DG1: generateDocument — unknown template throws", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key-gap-tests";
    mockCreate.mockReset();
    mockApiResponse();
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("throws Error for completely unknown template ID", async () => {
    await expect(
      generateDocument("TMPL_NONEXISTENT_FOOBAR", makeResult(), "GapCo", "Test system")
    ).rejects.toThrow("Unknown template: TMPL_NONEXISTENT_FOOBAR");
  });

  it("throws for empty string template ID", async () => {
    await expect(
      generateDocument("", makeResult(), "GapCo", "Test system")
    ).rejects.toThrow("Unknown template: ");
  });

  it("throws for template ID with typo", async () => {
    await expect(
      generateDocument("TMPL_RISK_MANAGEMNT", makeResult(), "GapCo", "Test system")
    ).rejects.toThrow("Unknown template: TMPL_RISK_MANAGEMNT");
  });

  it("does NOT throw for valid template IDs", async () => {
    const validIds = Object.keys(TEMPLATE_REGISTRY);
    expect(validIds.length).toBeGreaterThan(0);
    // Just verify one valid ID works
    await expect(
      generateDocument(validIds[0], makeResult(), "GapCo", "Test system")
    ).resolves.toBeDefined();
  });
});

// ============================================================================
// GAP-DG2: buildContextBlock — fineRisk falsy branch (line 180)
// ============================================================================

describe("GAP-DG2: generateDocument — result without fineRisk", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key-gap-tests";
    mockCreate.mockReset();
    mockApiResponse();
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("generates document successfully when fineRisk is undefined", async () => {
    const result = makeResult({ fineRisk: undefined } as any);
    const doc = await generateDocument(
      "TMPL_RISK_MANAGEMENT",
      result,
      "NoFineRiskCo",
      "A test system without fine risk info"
    );
    expect(doc.content).toBeDefined();
    expect(doc.templateName).toBeDefined();
  });

  it("prompt does NOT contain MAX FINE when fineRisk is missing", async () => {
    const result = makeResult({ fineRisk: undefined } as any);
    await generateDocument(
      "TMPL_RISK_MANAGEMENT",
      result,
      "NoFineRiskCo",
      "Test system"
    );
    // Extract the prompt sent to the mock API
    const call = mockCreate.mock.calls[0];
    const prompt: string = call[0].messages[0].content;
    expect(prompt).not.toContain("MAX FINE");
  });

  it("prompt DOES contain MAX FINE when fineRisk is present", async () => {
    await generateDocument(
      "TMPL_RISK_MANAGEMENT",
      makeResult(), // has fineRisk
      "WithFineRiskCo",
      "Test system"
    );
    const call = mockCreate.mock.calls[0];
    const prompt: string = call[0].messages[0].content;
    expect(prompt).toContain("MAX FINE");
  });

  it("generates document when result has no optional fields", async () => {
    const bareResult = makeResult({
      fineRisk: undefined,
      highRiskArea: undefined,
      transparencyObligations: undefined,
      prohibitedPractices: undefined,
    } as any);
    const doc = await generateDocument(
      "TMPL_TECHNICAL_DOC",
      bareResult,
      "BareCo",
      "Bare system"
    );
    expect(doc.content).toBeDefined();
    expect(doc.templateId).toBe("TMPL_TECHNICAL_DOC");
  });
});

// ============================================================================
// HELPER — base wizard answers for classification-engine branch tests
// ============================================================================

function baseAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return {
    companyName: "BranchTestCo",
    companySize: "SMALL",
    isEUBased: true,
    outputUsedInEU: true,
    role: "PROVIDER",
    systemDescription: "A generic AI system for branch testing",
    militaryDefenceOnly: false,
    scientificResearchOnly: false,
    personalNonProfessional: false,
    openSourceNonHighRisk: false,
    usesSubliminaManipulation: false,
    manipulationCausesSignificantHarm: false,
    exploitsVulnerabilities: false,
    exploitationCausesSignificantHarm: false,
    socialScoring: false,
    criminalRiskProfiling: false,
    crimeProfilingBasedSolelyOnPersonality: false,
    crimeProfilingSupportingHumanAssessment: false,
    facialRecognitionScraping: false,
    workplaceEmotionDetection: false,
    workplaceEmotionForMedicalSafety: false,
    biometricCategorisationSensitive: false,
    biometricCatForLawEnforcementLabelling: false,
    realtimeBiometricPublicSpaces: false,
    realtimeBiometricForLEException: false,
    realtimeBiometricHasJudicialAuth: false,
    isSafetyComponent: false,
    productUnderAnnexI: false,
    requiresThirdPartyConformity: false,
    usesBiometrics: false,
    isBiometricVerificationOnly: false,
    criticalInfrastructure: false,
    educationUseCase: false,
    employmentUseCase: false,
    essentialServicesUseCase: false,
    lawEnforcementUseCase: false,
    migrationUseCase: false,
    justiceUseCase: false,
    posesSignificantRiskOfHarm: false,
    narrowProceduralTask: false,
    improvesHumanActivity: false,
    detectsPatterns: false,
    preparatoryTask: false,
    performsProfiling: false,
    interactsWithHumans: false,
    generatesDeepfakes: false,
    generatesText: false,
    generatesMedia: false,
    usesEmotionRecognition: false,
    usesBiometricCategorisation: false,
    isGeneralPurposeModel: false,
    gpaiHighImpactCapabilities: false,
    gpaiOpenSource: false,
    ...overrides,
  };
}

// ============================================================================
// GAP-CE2: Extraterritorial overlay — HIGH_RISK + role "BOTH" (line 1584)
// Exercises the `result.role === "BOTH"` branch of the || in the compound
// condition `result.classification === "HIGH_RISK" && (role === "PROVIDER" || role === "BOTH")`
// Existing tests only used role "PROVIDER", leaving the "BOTH" alt untaken.
// ============================================================================

describe("GAP-CE2: Extraterritorial — HIGH_RISK with role BOTH", () => {
  it("non-EU role BOTH without authorised rep gets APPOINT_AUTHORISED_REP obligation", () => {
    const result = classifyAISystem(baseAnswers({
      role: "BOTH",
      educationUseCase: true,
      isEUBased: false,
      outputUsedInEU: true,
      hasAuthorisedRepInEU: false,
    }));
    expect(result.classification).toBe("HIGH_RISK");
    expect(result.role).toBe("BOTH");
    expect(result.obligations.some(o => o.id === "APPOINT_AUTHORISED_REP")).toBe(true);
    expect(result.warnings.some(w => w.includes("EXTRATERRITORIAL"))).toBe(true);
    expect(result.warnings.some(w => w.includes("Art 22(1)"))).toBe(true);
  });

  it("non-EU role BOTH WITH authorised rep does NOT get blocking warning", () => {
    const result = classifyAISystem(baseAnswers({
      role: "BOTH",
      educationUseCase: true,
      isEUBased: false,
      outputUsedInEU: true,
      hasAuthorisedRepInEU: true,
    }));
    expect(result.classification).toBe("HIGH_RISK");
    expect(result.role).toBe("BOTH");
    expect(result.obligations.some(o => o.id === "APPOINT_AUTHORISED_REP")).toBe(false);
    expect(result.nextSteps.some(s => s.includes("confirmed an authorised representative"))).toBe(true);
  });
});

// ============================================================================
// GAP-CE3: Extraterritorial overlay — GPAI_SYSTEMIC non-EU (line 1621)
// Exercises the `result.classification === "GPAI_SYSTEMIC"` branch of the ||
// in `(classification === "GPAI" || classification === "GPAI_SYSTEMIC") && !hasAuthorisedRepInEU`
// Existing tests only used GPAI, leaving the GPAI_SYSTEMIC alt untaken.
// ============================================================================

describe("GAP-CE3: Extraterritorial — GPAI_SYSTEMIC non-EU", () => {
  it("GPAI_SYSTEMIC non-EU without rep gets Art 54 warning", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiHighImpactCapabilities: true,
      isEUBased: false,
      outputUsedInEU: true,
      hasAuthorisedRepInEU: false,
    }));
    expect(result.classification).toBe("GPAI_SYSTEMIC");
    expect(result.warnings.some(w => w.includes("Art 54(1)"))).toBe(true);
    expect(result.warnings.some(w => w.includes("EXTRATERRITORIAL"))).toBe(true);
  });

  it("GPAI_SYSTEMIC non-EU WITH rep does NOT get Art 54 warning", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiHighImpactCapabilities: true,
      isEUBased: false,
      outputUsedInEU: true,
      hasAuthorisedRepInEU: true,
    }));
    expect(result.classification).toBe("GPAI_SYSTEMIC");
    expect(result.warnings.some(w => w.includes("Art 54(1)"))).toBe(false);
  });
});

// ============================================================================
// GAP-CE4: Transitional provisions — GPAI_SYSTEMIC already on market (line 1646)
// Exercises the `result.classification === "GPAI_SYSTEMIC"` branch of the ||
// in `gpaiAlreadyOnMarketBeforeAug2025 && (classification === "GPAI" || classification === "GPAI_SYSTEMIC")`
// Existing tests only used GPAI, leaving the GPAI_SYSTEMIC alt untaken.
// ============================================================================

describe("GAP-CE4: Transitional provisions — GPAI_SYSTEMIC already on market", () => {
  it("GPAI_SYSTEMIC on market before Aug 2025 gets Art 111(2) transition provision", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiHighImpactCapabilities: true,
      gpaiAlreadyOnMarketBeforeAug2025: true,
    }));
    expect(result.classification).toBe("GPAI_SYSTEMIC");
    expect(result.warnings.some(w => w.includes("Art 111(2)"))).toBe(true);
    expect(result.warnings.some(w => w.includes("2 August 2027"))).toBe(true);
  });

  it("GPAI_SYSTEMIC NOT on market before Aug 2025 does NOT get transition provision", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiHighImpactCapabilities: true,
      gpaiAlreadyOnMarketBeforeAug2025: false,
    }));
    expect(result.classification).toBe("GPAI_SYSTEMIC");
    expect(result.warnings.every(w => !w.includes("Art 111(2)"))).toBe(true);
  });
});
