/**
 * Shared mock factories for Layer 6 component tests.
 * Provides consistent test data across all UI test files.
 */
import type {
  ClassificationResult,
  Obligation,
  FineRisk,
  RiskClassification,
  Role,
  EnforcementTimeline,
} from "@/lib/classification-engine";
import type { GeneratedDocument } from "@/lib/doc-generator";

// ============================================================================
// Classification Result Factory
// ============================================================================

export function mockClassificationResult(
  overrides: Partial<ClassificationResult> = {}
): ClassificationResult {
  return {
    classification: "HIGH_RISK",
    role: "PROVIDER",
    confidence: "DEFINITIVE",
    legalBasis: ["Article 6", "Article 8-15"],
    obligations: [
      mockObligation({ priority: "CRITICAL", id: "OB_1" }),
      mockObligation({ priority: "HIGH", id: "OB_2", title: "Data Governance" }),
      mockObligation({ priority: "MEDIUM", id: "OB_3", title: "Logging Spec" }),
    ],
    enforcementDeadline: "2026-08-02",
    fineRisk: mockFineRisk(),
    nextSteps: [
      "Conduct conformity assessment",
      "Set up risk management system",
      "Register in EU database",
    ],
    warnings: [],
    smeSimplifications: [],
    ...overrides,
  };
}

// ============================================================================
// Obligation Factory
// ============================================================================

export function mockObligation(
  overrides: Partial<Obligation> = {}
): Obligation {
  return {
    id: "OB_TEST",
    article: "Article 9",
    title: "Risk Management System",
    description:
      "Establish a continuous iterative risk management process covering identification, evaluation, mitigation and testing of residual risks.",
    appliesToRole: "PROVIDER",
    priority: "CRITICAL",
    deadline: "2026-08-02",
    ...overrides,
  };
}

// ============================================================================
// FineRisk Factory
// ============================================================================

export function mockFineRisk(overrides: Partial<FineRisk> = {}): FineRisk {
  return {
    maxAmountGeneral: "€15,000,000",
    maxAmountSME: "€7,500,000",
    maxPercentTurnover: 3,
    article: "Article 99(3)",
    ...overrides,
  };
}

// ============================================================================
// GeneratedDocument Factory
// ============================================================================

export function mockGeneratedDocument(
  overrides: Partial<GeneratedDocument> = {}
): GeneratedDocument {
  return {
    templateId: "TMPL_RISK_MANAGEMENT",
    templateName: "Risk Management System",
    article: "Article 9",
    content: "# Risk Management\n\nThis is the generated content.\n\n## Section 1\n\nDetails here.",
    generatedAt: "2026-02-28T12:00:00.000Z",
    wordCount: 1500,
    disclaimer:
      "DISCLAIMER: This document was auto-generated using AI. It does NOT constitute legal advice.",
    ...overrides,
  };
}
