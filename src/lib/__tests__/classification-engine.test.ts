/**
 * EXHAUSTIVE TEST SUITE — EU AI Act Classification Engine v2
 * 
 * Covers ALL permutations and combinations:
 *   - 5 scope exclusions + no EU nexus
 *   - 8 prohibited practices (each with exception paths)
 *   - GPAI: standard, systemic (compute + high-impact), open-source exemptions
 *   - High-risk via safety component (Art 6(1))
 *   - High-risk via Annex III (8 areas × sub-types)
 *   - Art 6(3) exception (dual condition + profiling override)
 *   - Biometric verification exclusion
 *   - 6 transparency obligations (Art 50)
 *   - Minimal risk default
 *   - Role-based obligations (PROVIDER vs DEPLOYER vs BOTH)
 *   - SME-aware fine calculations (MICRO/SMALL/MEDIUM/LARGE)
 *   - 10+ real-world scenario tests
 *   - Edge cases and boundary conditions
 * 
 * Total: 100+ test cases
 */

import { describe, it, expect } from "vitest";
import {
  classifyAISystem,
  getEnforcementTimeline,
  type WizardAnswers,
  type RiskClassification,
  type ClassificationResult,
} from "../classification-engine";

// ============================================================================
// HELPER: Base answers template (minimal risk default)
// ============================================================================

function baseAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return {
    // Step 1: Company basics
    companyName: "TestCo",
    companySize: "SMALL",
    isEUBased: true,
    outputUsedInEU: true,

    // Step 2: Role
    role: "PROVIDER",

    // Step 3: System description
    systemDescription: "A generic AI system for testing",

    // Step 4: Scope exclusions — all false
    militaryDefenceOnly: false,
    scientificResearchOnly: false,
    personalNonProfessional: false,
    openSourceNonHighRisk: false,

    // Step 5: Prohibited practices — all false
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

    // Step 6: Safety component — all false
    isSafetyComponent: false,
    productUnderAnnexI: false,
    requiresThirdPartyConformity: false,

    // Step 7: Annex III areas — all false
    usesBiometrics: false,
    isBiometricVerificationOnly: false,
    criticalInfrastructure: false,
    educationUseCase: false,
    employmentUseCase: false,
    essentialServicesUseCase: false,
    lawEnforcementUseCase: false,
    migrationUseCase: false,
    justiceUseCase: false,

    // Step 8: Art 6(3) exception — all false
    posesSignificantRiskOfHarm: false,
    narrowProceduralTask: false,
    improvesHumanActivity: false,
    detectsPatterns: false,
    preparatoryTask: false,
    performsProfiling: false,

    // Step 9: Transparency — all false
    interactsWithHumans: false,
    generatesDeepfakes: false,
    generatesText: false,
    generatesMedia: false,
    usesEmotionRecognition: false,
    usesBiometricCategorisation: false,

    // Step 10: GPAI — all false
    isGeneralPurposeModel: false,
    gpaiHighImpactCapabilities: false,
    gpaiOpenSource: false,

    ...overrides,
  };
}

// ============================================================================
// 1. MINIMAL RISK DEFAULT
// ============================================================================

describe("Minimal Risk (default classification)", () => {
  it("should classify a generic system with no triggers as MINIMAL_RISK", () => {
    const result = classifyAISystem(baseAnswers());
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.confidence).toBe("DEFINITIVE");
    expect(result.legalBasis).toContain("Article 95 (voluntary codes of conduct)");
  });

  it("should always include AI literacy obligation (Art 4)", () => {
    const result = classifyAISystem(baseAnswers());
    const aiLiteracy = result.obligations.find((o) => o.id === "AI_LITERACY");
    expect(aiLiteracy).toBeDefined();
    expect(aiLiteracy!.article).toBe("Article 4");
    expect(aiLiteracy!.appliesToRole).toBe("BOTH");
  });

  it("should have no fines for minimal risk", () => {
    const result = classifyAISystem(baseAnswers());
    expect(result.fineRisk.maxAmountGeneral).toBe("N/A");
    expect(result.fineRisk.maxPercentTurnover).toBe(0);
  });

  it("should preserve input role in output", () => {
    const provider = classifyAISystem(baseAnswers({ role: "PROVIDER" }));
    expect(provider.role).toBe("PROVIDER");

    const deployer = classifyAISystem(baseAnswers({ role: "DEPLOYER" }));
    expect(deployer.role).toBe("DEPLOYER");

    const both = classifyAISystem(baseAnswers({ role: "BOTH" }));
    expect(both.role).toBe("BOTH");
  });
});

// ============================================================================
// 2. SCOPE EXCLUSIONS (Article 2)
// ============================================================================

describe("Scope Exclusions (Article 2)", () => {
  it("should exclude military/defence systems — Art 2(3)", () => {
    const result = classifyAISystem(baseAnswers({ militaryDefenceOnly: true }));
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.confidence).toBe("LIKELY");
    expect(result.legalBasis).toContain("Article 2");
    expect(result.nextSteps.join(" ")).toContain("OUTSIDE THE SCOPE");
    expect(result.nextSteps.join(" ")).toContain("Military/defence/national security");
  });

  it("should exclude scientific R&D — Art 2(6)", () => {
    const result = classifyAISystem(baseAnswers({ scientificResearchOnly: true }));
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.nextSteps.join(" ")).toContain("Scientific R&D");
  });

  it("should exclude personal non-professional use — Art 2(10)", () => {
    const result = classifyAISystem(baseAnswers({ personalNonProfessional: true }));
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.nextSteps.join(" ")).toContain("Personal non-professional");
  });

  it("should exclude open-source non-high-risk — Art 2(12) with warning", () => {
    const result = classifyAISystem(baseAnswers({ openSourceNonHighRisk: true }));
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.nextSteps.join(" ")).toContain("Open-source");
    // v2: Must warn that open-source exclusion doesn't apply to high-risk/prohibited/Art 50
    expect(result.warnings.join(" ")).toContain("Open-source exclusion does NOT apply");
  });

  it("should exclude no EU nexus — Art 2(1)", () => {
    const result = classifyAISystem(
      baseAnswers({ isEUBased: false, outputUsedInEU: false })
    );
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.nextSteps.join(" ")).toContain("No EU nexus");
  });

  it("should NOT exclude if EU-based (even if output not in EU)", () => {
    const result = classifyAISystem(
      baseAnswers({ isEUBased: true, outputUsedInEU: false })
    );
    // Should not get scope exclusion for no EU nexus
    expect(result.nextSteps.join(" ")).not.toContain("No EU nexus");
  });

  it("should NOT exclude if output used in EU (even if not EU-based)", () => {
    const result = classifyAISystem(
      baseAnswers({ isEUBased: false, outputUsedInEU: true })
    );
    expect(result.nextSteps.join(" ")).not.toContain("No EU nexus");
  });

  it("should still include AI literacy even for excluded systems", () => {
    const result = classifyAISystem(baseAnswers({ militaryDefenceOnly: true }));
    const aiLiteracy = result.obligations.find((o) => o.id === "AI_LITERACY");
    expect(aiLiteracy).toBeDefined();
  });

  it("should combine multiple exclusions", () => {
    const result = classifyAISystem(
      baseAnswers({
        militaryDefenceOnly: true,
        scientificResearchOnly: true,
      })
    );
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.nextSteps.join(" ")).toContain("Military/defence");
    expect(result.nextSteps.join(" ")).toContain("Scientific R&D");
  });

  it("scope exclusion should take priority over prohibited practices", () => {
    // A military social scoring system should be excluded, not prohibited
    const result = classifyAISystem(
      baseAnswers({
        militaryDefenceOnly: true,
        socialScoring: true,
      })
    );
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.nextSteps.join(" ")).toContain("OUTSIDE THE SCOPE");
  });
});

// ============================================================================
// 3. PROHIBITED PRACTICES (Article 5) — 8 practices × exception paths
// ============================================================================

describe("Prohibited Practices (Article 5)", () => {
  // ── Art 5(1)(a): Subliminal/manipulative techniques ──────────────────
  describe("Art 5(1)(a) — Subliminal/manipulative techniques", () => {
    it("should be PROHIBITED when manipulation + significant harm", () => {
      const result = classifyAISystem(
        baseAnswers({
          usesSubliminaManipulation: true,
          manipulationCausesSignificantHarm: true,
        })
      );
      expect(result.classification).toBe("PROHIBITED");
      expect(result.prohibitedPractices).toContain("SUBLIMINAL_MANIPULATION");
      expect(result.legalBasis).toContain("Article 5(1)(a)");
      expect(result.enforcementDeadline).toBe("2025-02-02");
    });

    it("should NOT be prohibited when manipulation but NO significant harm (grey area warning)", () => {
      const result = classifyAISystem(
        baseAnswers({
          usesSubliminaManipulation: true,
          manipulationCausesSignificantHarm: false,
        })
      );
      expect(result.classification).not.toBe("PROHIBITED");
      // Default falls through to minimal risk
    });

    it("should NOT trigger when manipulation is false", () => {
      const result = classifyAISystem(
        baseAnswers({
          usesSubliminaManipulation: false,
          manipulationCausesSignificantHarm: true,
        })
      );
      expect(result.classification).not.toBe("PROHIBITED");
    });
  });

  // ── Art 5(1)(b): Exploiting vulnerabilities ──────────────────────────
  describe("Art 5(1)(b) — Exploiting vulnerabilities", () => {
    it("should be PROHIBITED when exploitation + significant harm", () => {
      const result = classifyAISystem(
        baseAnswers({
          exploitsVulnerabilities: true,
          exploitationCausesSignificantHarm: true,
        })
      );
      expect(result.classification).toBe("PROHIBITED");
      expect(result.prohibitedPractices).toContain("VULNERABILITY_EXPLOITATION");
      expect(result.legalBasis).toContain("Article 5(1)(b)");
    });

    it("should NOT be prohibited when exploitation but NO significant harm", () => {
      const result = classifyAISystem(
        baseAnswers({
          exploitsVulnerabilities: true,
          exploitationCausesSignificantHarm: false,
        })
      );
      expect(result.classification).not.toBe("PROHIBITED");
    });
  });

  // ── Art 5(1)(c): Social scoring ──────────────────────────────────────
  describe("Art 5(1)(c) — Social scoring", () => {
    it("should be PROHIBITED (no exceptions)", () => {
      const result = classifyAISystem(baseAnswers({ socialScoring: true }));
      expect(result.classification).toBe("PROHIBITED");
      expect(result.prohibitedPractices).toContain("SOCIAL_SCORING");
      expect(result.legalBasis).toContain("Article 5(1)(c)");
    });
  });

  // ── Art 5(1)(d): Criminal risk profiling ─────────────────────────────
  describe("Art 5(1)(d) — Criminal risk profiling", () => {
    it("should be PROHIBITED when SOLELY based on personality profiling + NOT supporting human assessment", () => {
      const result = classifyAISystem(
        baseAnswers({
          criminalRiskProfiling: true,
          crimeProfilingBasedSolelyOnPersonality: true,
          crimeProfilingSupportingHumanAssessment: false,
        })
      );
      expect(result.classification).toBe("PROHIBITED");
      expect(result.prohibitedPractices).toContain("CRIMINAL_RISK_PROFILING_SOLELY");
      expect(result.legalBasis).toContain("Article 5(1)(d)");
    });

    it("should NOT be prohibited when supporting human assessment of factual evidence (exception)", () => {
      const result = classifyAISystem(
        baseAnswers({
          criminalRiskProfiling: true,
          crimeProfilingBasedSolelyOnPersonality: true,
          crimeProfilingSupportingHumanAssessment: true,
        })
      );
      expect(result.classification).not.toBe("PROHIBITED");
    });

    it("should NOT be prohibited when not solely based on personality", () => {
      const result = classifyAISystem(
        baseAnswers({
          criminalRiskProfiling: true,
          crimeProfilingBasedSolelyOnPersonality: false,
          crimeProfilingSupportingHumanAssessment: false,
        })
      );
      expect(result.classification).not.toBe("PROHIBITED");
    });

    it("should NOT trigger when criminalRiskProfiling is false", () => {
      const result = classifyAISystem(
        baseAnswers({
          criminalRiskProfiling: false,
          crimeProfilingBasedSolelyOnPersonality: true,
        })
      );
      expect(result.classification).not.toBe("PROHIBITED");
    });
  });

  // ── Art 5(1)(e): Untargeted facial scraping ──────────────────────────
  describe("Art 5(1)(e) — Untargeted facial scraping", () => {
    it("should be PROHIBITED (no exceptions)", () => {
      const result = classifyAISystem(
        baseAnswers({ facialRecognitionScraping: true })
      );
      expect(result.classification).toBe("PROHIBITED");
      expect(result.prohibitedPractices).toContain("UNTARGETED_FACIAL_SCRAPING");
      expect(result.legalBasis).toContain("Article 5(1)(e)");
    });
  });

  // ── Art 5(1)(f): Workplace/education emotion detection ───────────────
  describe("Art 5(1)(f) — Workplace/education emotion detection", () => {
    it("should be PROHIBITED when emotion detection WITHOUT medical/safety exception", () => {
      const result = classifyAISystem(
        baseAnswers({
          workplaceEmotionDetection: true,
          workplaceEmotionForMedicalSafety: false,
        })
      );
      expect(result.classification).toBe("PROHIBITED");
      expect(result.prohibitedPractices).toContain("WORKPLACE_EMOTION_DETECTION");
      expect(result.legalBasis).toContain("Article 5(1)(f)");
    });

    it("should NOT be prohibited when emotion detection FOR medical/safety purposes (exception)", () => {
      const result = classifyAISystem(
        baseAnswers({
          workplaceEmotionDetection: true,
          workplaceEmotionForMedicalSafety: true,
        })
      );
      expect(result.classification).not.toBe("PROHIBITED");
    });
  });

  // ── Art 5(1)(g): Biometric categorisation by sensitive attributes ────
  describe("Art 5(1)(g) — Biometric categorisation by sensitive attributes", () => {
    it("should be PROHIBITED when sensitive biometric cat WITHOUT LE labelling exception", () => {
      const result = classifyAISystem(
        baseAnswers({
          biometricCategorisationSensitive: true,
          biometricCatForLawEnforcementLabelling: false,
        })
      );
      expect(result.classification).toBe("PROHIBITED");
      expect(result.prohibitedPractices).toContain("BIOMETRIC_CATEGORISATION_SENSITIVE");
      expect(result.legalBasis).toContain("Article 5(1)(g)");
    });

    it("should NOT be prohibited when LE labelling/filtering exception applies", () => {
      const result = classifyAISystem(
        baseAnswers({
          biometricCategorisationSensitive: true,
          biometricCatForLawEnforcementLabelling: true,
        })
      );
      expect(result.classification).not.toBe("PROHIBITED");
    });
  });

  // ── Art 5(1)(h): Real-time remote biometric ID in public spaces ──────
  describe("Art 5(1)(h) — Real-time remote biometric ID in public spaces", () => {
    it("should be PROHIBITED when no LE exception claimed", () => {
      const result = classifyAISystem(
        baseAnswers({
          realtimeBiometricPublicSpaces: true,
          realtimeBiometricForLEException: false,
          realtimeBiometricHasJudicialAuth: false,
        })
      );
      expect(result.classification).toBe("PROHIBITED");
      expect(result.prohibitedPractices).toContain("REALTIME_BIOMETRIC_LAW_ENFORCEMENT");
    });

    it("should be PROHIBITED when LE exception claimed but NO judicial authorization", () => {
      const result = classifyAISystem(
        baseAnswers({
          realtimeBiometricPublicSpaces: true,
          realtimeBiometricForLEException: true,
          realtimeBiometricHasJudicialAuth: false,
        })
      );
      expect(result.classification).toBe("PROHIBITED");
      expect(result.prohibitedPractices).toContain("REALTIME_BIOMETRIC_LAW_ENFORCEMENT");
      // Should warn about missing judicial authorization
      expect(result.warnings.join(" ")).toContain("judicial");
    });

    it("should NOT be prohibited when LE exception + judicial authorization (full exception)", () => {
      const result = classifyAISystem(
        baseAnswers({
          realtimeBiometricPublicSpaces: true,
          realtimeBiometricForLEException: true,
          realtimeBiometricHasJudicialAuth: true,
        })
      );
      expect(result.classification).not.toBe("PROHIBITED");
    });
  });

  // ── Multiple prohibited practices simultaneously ─────────────────────
  describe("Multiple prohibited practices", () => {
    it("should list all violated practices", () => {
      const result = classifyAISystem(
        baseAnswers({
          socialScoring: true,
          facialRecognitionScraping: true,
        })
      );
      expect(result.classification).toBe("PROHIBITED");
      expect(result.prohibitedPractices).toContain("SOCIAL_SCORING");
      expect(result.prohibitedPractices).toContain("UNTARGETED_FACIAL_SCRAPING");
      expect(result.legalBasis).toContain("Article 5(1)(c)");
      expect(result.legalBasis).toContain("Article 5(1)(e)");
    });
  });

  // ── Common properties for all PROHIBITED results ─────────────────────
  describe("PROHIBITED result common properties", () => {
    it("should have DEFINITIVE confidence", () => {
      const result = classifyAISystem(baseAnswers({ socialScoring: true }));
      expect(result.confidence).toBe("DEFINITIVE");
    });

    it("should have enforcement deadline 2025-02-02", () => {
      const result = classifyAISystem(baseAnswers({ socialScoring: true }));
      expect(result.enforcementDeadline).toBe("2025-02-02");
    });

    it("should have CEASE_AND_DESIST obligation", () => {
      const result = classifyAISystem(baseAnswers({ socialScoring: true }));
      const cease = result.obligations.find((o) => o.id === "CEASE_AND_DESIST");
      expect(cease).toBeDefined();
      expect(cease!.priority).toBe("CRITICAL");
    });

    it("should have highest fine tier (€35M / 7%)", () => {
      const result = classifyAISystem(baseAnswers({ socialScoring: true }));
      expect(result.fineRisk.maxAmountGeneral).toBe("€35,000,000");
      expect(result.fineRisk.maxPercentTurnover).toBe(7);
    });

    it("should include AI literacy in obligations", () => {
      const result = classifyAISystem(baseAnswers({ socialScoring: true }));
      const aiLiteracy = result.obligations.find((o) => o.id === "AI_LITERACY");
      expect(aiLiteracy).toBeDefined();
    });
  });
});

// ============================================================================
// 4. GENERAL-PURPOSE AI MODELS (Articles 51-56)
// ============================================================================

describe("GPAI Models (Articles 51-56)", () => {
  describe("Standard GPAI (non-systemic)", () => {
    it("should classify as GPAI", () => {
      const result = classifyAISystem(
        baseAnswers({
          isGeneralPurposeModel: true,
          gpaiHighImpactCapabilities: false,
          gpaiOpenSource: false,
        })
      );
      expect(result.classification).toBe("GPAI");
      expect(result.confidence).toBe("DEFINITIVE");
      expect(result.legalBasis).toContain("Article 53");
      expect(result.enforcementDeadline).toBe("2025-08-02");
    });

    it("should include all 4 base obligations (non-open-source)", () => {
      const result = classifyAISystem(
        baseAnswers({
          isGeneralPurposeModel: true,
          gpaiOpenSource: false,
        })
      );
      const oblIds = result.obligations.map((o) => o.id);
      expect(oblIds).toContain("GPAI_TECHNICAL_DOC");
      expect(oblIds).toContain("GPAI_DOWNSTREAM_INFO");
      expect(oblIds).toContain("GPAI_COPYRIGHT_POLICY");
      expect(oblIds).toContain("GPAI_TRAINING_SUMMARY");
    });

    it("should have €15M / 3% fine tier", () => {
      const result = classifyAISystem(
        baseAnswers({ isGeneralPurposeModel: true })
      );
      expect(result.fineRisk.maxAmountGeneral).toBe("€15,000,000");
      expect(result.fineRisk.maxPercentTurnover).toBe(3);
    });
  });

  describe("GPAI Open-source (non-systemic)", () => {
    it("should grant partial exemption from (a) tech doc and (b) downstream info", () => {
      const result = classifyAISystem(
        baseAnswers({
          isGeneralPurposeModel: true,
          gpaiOpenSource: true,
          gpaiHighImpactCapabilities: false,
        })
      );
      expect(result.classification).toBe("GPAI");
      const oblIds = result.obligations.map((o) => o.id);
      // Should NOT have tech doc or downstream info
      expect(oblIds).not.toContain("GPAI_TECHNICAL_DOC");
      expect(oblIds).not.toContain("GPAI_DOWNSTREAM_INFO");
      // MUST still have copyright policy and training summary
      expect(oblIds).toContain("GPAI_COPYRIGHT_POLICY");
      expect(oblIds).toContain("GPAI_TRAINING_SUMMARY");
    });
  });

  describe("GPAI Systemic Risk", () => {
    it("should classify as GPAI_SYSTEMIC when high-impact capabilities", () => {
      const result = classifyAISystem(
        baseAnswers({
          isGeneralPurposeModel: true,
          gpaiHighImpactCapabilities: true,
        })
      );
      expect(result.classification).toBe("GPAI_SYSTEMIC");
      expect(result.legalBasis).toContain("Article 51");
      expect(result.legalBasis).toContain("Article 55");
    });

    it("should classify as GPAI_SYSTEMIC when compute > 10^25 FLOPs", () => {
      const result = classifyAISystem(
        baseAnswers({
          isGeneralPurposeModel: true,
          gpaiTrainingCompute: 2e25,
          gpaiHighImpactCapabilities: false,
        })
      );
      expect(result.classification).toBe("GPAI_SYSTEMIC");
    });

    it("should NOT be systemic when compute exactly at 10^25 FLOPs (boundary)", () => {
      const result = classifyAISystem(
        baseAnswers({
          isGeneralPurposeModel: true,
          gpaiTrainingCompute: 1e25,
          gpaiHighImpactCapabilities: false,
        })
      );
      // 1e25 is NOT > 1e25, so should be standard GPAI
      expect(result.classification).toBe("GPAI");
    });

    it("should include MODEL_EVALUATION, SYSTEMIC_RISK_MITIGATION, SERIOUS_INCIDENT_TRACKING, CYBERSECURITY obligations", () => {
      const result = classifyAISystem(
        baseAnswers({
          isGeneralPurposeModel: true,
          gpaiHighImpactCapabilities: true,
        })
      );
      const oblIds = result.obligations.map((o) => o.id);
      expect(oblIds).toContain("MODEL_EVALUATION");
      expect(oblIds).toContain("SYSTEMIC_RISK_MITIGATION");
      expect(oblIds).toContain("SERIOUS_INCIDENT_TRACKING");
      expect(oblIds).toContain("CYBERSECURITY_GPAI");
    });

    it("should NOT grant open-source exemption for systemic risk models (Art 53(2))", () => {
      const result = classifyAISystem(
        baseAnswers({
          isGeneralPurposeModel: true,
          gpaiOpenSource: true,
          gpaiHighImpactCapabilities: true,
        })
      );
      expect(result.classification).toBe("GPAI_SYSTEMIC");
      const oblIds = result.obligations.map((o) => o.id);
      // Open-source doesn't help — ALL obligations apply
      expect(oblIds).toContain("GPAI_TECHNICAL_DOC");
      expect(oblIds).toContain("GPAI_DOWNSTREAM_INFO");
      // Should warn that open-source exception doesn't apply
      expect(result.warnings.join(" ")).toContain("Open-source exception does NOT apply");
    });
  });

  describe("GPAI takes priority over high-risk", () => {
    it("GPAI should be checked before Annex III", () => {
      const result = classifyAISystem(
        baseAnswers({
          isGeneralPurposeModel: true,
          educationUseCase: true, // Would be high-risk but GPAI comes first
        })
      );
      expect(result.classification).toBe("GPAI");
    });
  });
});

// ============================================================================
// 5. HIGH-RISK VIA SAFETY COMPONENT (Article 6(1))
// ============================================================================

describe("High-Risk via Safety Component (Art 6(1))", () => {
  it("should classify as HIGH_RISK when all three conditions met", () => {
    const result = classifyAISystem(
      baseAnswers({
        isSafetyComponent: true,
        productUnderAnnexI: true,
        requiresThirdPartyConformity: true,
      })
    );
    expect(result.classification).toBe("HIGH_RISK");
    expect(result.confidence).toBe("LIKELY");
    expect(result.legalBasis).toContain("Article 6(1)");
    expect(result.legalBasis).toContain("Annex I");
    expect(result.enforcementDeadline).toBe("2027-08-02"); // Extra year for Annex I Section A
  });

  it("should NOT be high-risk if only safety component (missing product under Annex I)", () => {
    const result = classifyAISystem(
      baseAnswers({
        isSafetyComponent: true,
        productUnderAnnexI: false,
        requiresThirdPartyConformity: true,
      })
    );
    expect(result.classification).not.toBe("HIGH_RISK");
  });

  it("should NOT be high-risk if only safety + Annex I (missing third-party conformity)", () => {
    const result = classifyAISystem(
      baseAnswers({
        isSafetyComponent: true,
        productUnderAnnexI: true,
        requiresThirdPartyConformity: false,
      })
    );
    expect(result.classification).not.toBe("HIGH_RISK");
  });

  it("should include SME simplifications where applicable", () => {
    const result = classifyAISystem(
      baseAnswers({
        isSafetyComponent: true,
        productUnderAnnexI: true,
        requiresThirdPartyConformity: true,
        companySize: "MICRO",
      })
    );
    expect(result.smeSimplifications.length).toBeGreaterThan(0);
    expect(result.smeSimplifications.join(" ")).toContain("regulatory sandbox");
  });
});

// ============================================================================
// 6. HIGH-RISK VIA ANNEX III (Article 6(2)) — 8 areas
// ============================================================================

describe("High-Risk via Annex III (Art 6(2))", () => {
  // ── Point 1: Biometrics ──────────────────────────────────────────────
  describe("Point 1 — Biometrics", () => {
    it("should be HIGH_RISK for remote identification", () => {
      const result = classifyAISystem(
        baseAnswers({
          usesBiometrics: true,
          biometricType: "REMOTE_IDENTIFICATION",
          isBiometricVerificationOnly: false,
        })
      );
      expect(result.classification).toBe("HIGH_RISK");
      expect(result.highRiskArea).toBe("BIOMETRICS");
      expect(result.legalBasis).toContain("Annex III, point 1");
    });

    it("should be HIGH_RISK for biometric categorisation", () => {
      const result = classifyAISystem(
        baseAnswers({
          usesBiometrics: true,
          biometricType: "CATEGORISATION",
          isBiometricVerificationOnly: false,
        })
      );
      expect(result.classification).toBe("HIGH_RISK");
      expect(result.highRiskArea).toBe("BIOMETRICS");
    });

    it("should be HIGH_RISK for emotion recognition", () => {
      const result = classifyAISystem(
        baseAnswers({
          usesBiometrics: true,
          biometricType: "EMOTION_RECOGNITION",
          isBiometricVerificationOnly: false,
        })
      );
      expect(result.classification).toBe("HIGH_RISK");
      expect(result.highRiskArea).toBe("BIOMETRICS");
    });

    it("should EXCLUDE biometric verification (phone unlock) — NOT high-risk (Recital 54)", () => {
      const result = classifyAISystem(
        baseAnswers({
          usesBiometrics: true,
          biometricType: "REMOTE_IDENTIFICATION",
          isBiometricVerificationOnly: true,
        })
      );
      expect(result.classification).not.toBe("HIGH_RISK");
    });
  });

  // ── Point 2: Critical infrastructure ─────────────────────────────────
  describe("Point 2 — Critical infrastructure", () => {
    it("should be HIGH_RISK", () => {
      const result = classifyAISystem(
        baseAnswers({ criticalInfrastructure: true })
      );
      expect(result.classification).toBe("HIGH_RISK");
      expect(result.highRiskArea).toBe("CRITICAL_INFRASTRUCTURE");
      expect(result.legalBasis).toContain("Annex III, point 2");
    });
  });

  // ── Point 3: Education ───────────────────────────────────────────────
  describe("Point 3 — Education", () => {
    it("should be HIGH_RISK", () => {
      const result = classifyAISystem(
        baseAnswers({ educationUseCase: true })
      );
      expect(result.classification).toBe("HIGH_RISK");
      expect(result.highRiskArea).toBe("EDUCATION");
      expect(result.legalBasis).toContain("Annex III, point 3");
    });

    for (const eduType of [
      "ADMISSION_ACCESS",
      "LEARNING_ASSESSMENT",
      "EDUCATION_LEVEL",
      "BEHAVIOUR_MONITORING",
    ] as const) {
      it(`should accept education type: ${eduType}`, () => {
        const result = classifyAISystem(
          baseAnswers({ educationUseCase: true, educationType: eduType })
        );
        expect(result.classification).toBe("HIGH_RISK");
      });
    }
  });

  // ── Point 4: Employment ──────────────────────────────────────────────
  describe("Point 4 — Employment", () => {
    it("should be HIGH_RISK", () => {
      const result = classifyAISystem(
        baseAnswers({ employmentUseCase: true })
      );
      expect(result.classification).toBe("HIGH_RISK");
      expect(result.highRiskArea).toBe("EMPLOYMENT");
      expect(result.legalBasis).toContain("Annex III, point 4");
    });

    for (const empType of [
      "RECRUITMENT_SELECTION",
      "WORK_CONDITIONS_PROMOTION_TERMINATION",
      "TASK_ALLOCATION",
      "MONITORING_EVALUATION",
    ] as const) {
      it(`should accept employment type: ${empType}`, () => {
        const result = classifyAISystem(
          baseAnswers({ employmentUseCase: true, employmentType: empType })
        );
        expect(result.classification).toBe("HIGH_RISK");
      });
    }
  });

  // ── Point 5: Essential services ──────────────────────────────────────
  describe("Point 5 — Essential services", () => {
    it("should be HIGH_RISK", () => {
      const result = classifyAISystem(
        baseAnswers({ essentialServicesUseCase: true })
      );
      expect(result.classification).toBe("HIGH_RISK");
      expect(result.highRiskArea).toBe("ESSENTIAL_SERVICES");
      expect(result.legalBasis).toContain("Annex III, point 5");
    });

    for (const svcType of [
      "CREDITWORTHINESS",
      "INSURANCE_RISK_PRICING",
      "PUBLIC_BENEFITS",
      "EMERGENCY_DISPATCH",
      "CREDIT_SCORING",
    ] as const) {
      it(`should accept essential service type: ${svcType}`, () => {
        const result = classifyAISystem(
          baseAnswers({
            essentialServicesUseCase: true,
            essentialServiceType: svcType,
          })
        );
        expect(result.classification).toBe("HIGH_RISK");
      });
    }
  });

  // ── Point 6: Law enforcement ─────────────────────────────────────────
  describe("Point 6 — Law enforcement", () => {
    it("should be HIGH_RISK", () => {
      const result = classifyAISystem(
        baseAnswers({ lawEnforcementUseCase: true })
      );
      expect(result.classification).toBe("HIGH_RISK");
      expect(result.highRiskArea).toBe("LAW_ENFORCEMENT");
      expect(result.legalBasis).toContain("Annex III, point 6");
    });

    for (const leType of [
      "POLYGRAPH",
      "EVIDENCE_RELIABILITY",
      "RISK_ASSESSMENT",
      "CRIME_ANALYTICS",
      "POST_BIOMETRIC_ID",
    ] as const) {
      it(`should accept law enforcement type: ${leType}`, () => {
        const result = classifyAISystem(
          baseAnswers({
            lawEnforcementUseCase: true,
            lawEnforcementType: leType,
          })
        );
        expect(result.classification).toBe("HIGH_RISK");
      });
    }
  });

  // ── Point 7: Migration, asylum, border control ───────────────────────
  describe("Point 7 — Migration, asylum, border control", () => {
    it("should be HIGH_RISK", () => {
      const result = classifyAISystem(
        baseAnswers({ migrationUseCase: true })
      );
      expect(result.classification).toBe("HIGH_RISK");
      expect(result.highRiskArea).toBe("MIGRATION_ASYLUM_BORDER");
      expect(result.legalBasis).toContain("Annex III, point 7");
    });

    for (const migType of [
      "POLYGRAPH",
      "RISK_ASSESSMENT",
      "APPLICATION_EXAMINATION",
      "BORDER_DETECTION",
    ] as const) {
      it(`should accept migration type: ${migType}`, () => {
        const result = classifyAISystem(
          baseAnswers({ migrationUseCase: true, migrationType: migType })
        );
        expect(result.classification).toBe("HIGH_RISK");
      });
    }
  });

  // ── Point 8: Justice & democracy ─────────────────────────────────────
  describe("Point 8 — Justice & democracy", () => {
    it("should be HIGH_RISK", () => {
      const result = classifyAISystem(
        baseAnswers({ justiceUseCase: true })
      );
      expect(result.classification).toBe("HIGH_RISK");
      expect(result.highRiskArea).toBe("JUSTICE_DEMOCRACY");
      expect(result.legalBasis).toContain("Annex III, point 8");
    });

    for (const jusType of [
      "COURT_RESEARCH_APPLICATION",
      "ALTERNATIVE_DISPUTE_RESOLUTION",
      "ELECTION_INFLUENCE",
    ] as const) {
      it(`should accept justice type: ${jusType}`, () => {
        const result = classifyAISystem(
          baseAnswers({ justiceUseCase: true, justiceType: jusType })
        );
        expect(result.classification).toBe("HIGH_RISK");
      });
    }
  });

  // ── Common properties for HIGH_RISK results ──────────────────────────
  describe("HIGH_RISK Annex III common properties", () => {
    it("should have DEFINITIVE confidence", () => {
      const result = classifyAISystem(
        baseAnswers({ educationUseCase: true })
      );
      expect(result.confidence).toBe("DEFINITIVE");
    });

    it("should have enforcement deadline 2026-08-02", () => {
      const result = classifyAISystem(
        baseAnswers({ employmentUseCase: true })
      );
      expect(result.enforcementDeadline).toBe("2026-08-02");
    });

    it("should have €15M / 3% fine tier", () => {
      const result = classifyAISystem(
        baseAnswers({ criticalInfrastructure: true })
      );
      expect(result.fineRisk.maxAmountGeneral).toBe("€15,000,000");
      expect(result.fineRisk.maxPercentTurnover).toBe(3);
    });
  });
});

// ============================================================================
// 7. ART 6(3) EXCEPTION — Non-High-Risk Exception for Annex III Systems
// ============================================================================

describe("Art 6(3) Exception (Annex III → non-high-risk)", () => {
  it("should grant exception when: no significant risk + narrow procedural task", () => {
    const result = classifyAISystem(
      baseAnswers({
        educationUseCase: true,
        posesSignificantRiskOfHarm: false,
        narrowProceduralTask: true,
      })
    );
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.legalBasis).toContain("Article 6(3)");
    expect(result.legalBasis).toContain("Annex III, point 3");
  });

  it("should grant exception when: no significant risk + improves human activity", () => {
    const result = classifyAISystem(
      baseAnswers({
        employmentUseCase: true,
        posesSignificantRiskOfHarm: false,
        improvesHumanActivity: true,
      })
    );
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.legalBasis).toContain("Article 6(3)");
  });

  it("should grant exception when: no significant risk + detects patterns", () => {
    const result = classifyAISystem(
      baseAnswers({
        essentialServicesUseCase: true,
        posesSignificantRiskOfHarm: false,
        detectsPatterns: true,
      })
    );
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.legalBasis).toContain("Article 6(3)");
  });

  it("should grant exception when: no significant risk + preparatory task", () => {
    const result = classifyAISystem(
      baseAnswers({
        lawEnforcementUseCase: true,
        posesSignificantRiskOfHarm: false,
        preparatoryTask: true,
      })
    );
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.legalBasis).toContain("Article 6(3)");
  });

  it("should DENY exception when significant risk of harm (even with condition met)", () => {
    const result = classifyAISystem(
      baseAnswers({
        educationUseCase: true,
        posesSignificantRiskOfHarm: true,  // <-- blocks the exception
        narrowProceduralTask: true,
      })
    );
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("should DENY exception when no condition (a)-(d) met (even with no significant risk)", () => {
    const result = classifyAISystem(
      baseAnswers({
        educationUseCase: true,
        posesSignificantRiskOfHarm: false,
        narrowProceduralTask: false,
        improvesHumanActivity: false,
        detectsPatterns: false,
        preparatoryTask: false,
      })
    );
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("should OVERRIDE exception when system performs profiling (always high-risk)", () => {
    const result = classifyAISystem(
      baseAnswers({
        educationUseCase: true,
        posesSignificantRiskOfHarm: false,
        narrowProceduralTask: true,
        performsProfiling: true, // <-- overrides the exception
      })
    );
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("should require DOCUMENT_NON_HIGH_RISK and REGISTER_NON_HIGH_RISK obligations", () => {
    const result = classifyAISystem(
      baseAnswers({
        educationUseCase: true,
        posesSignificantRiskOfHarm: false,
        narrowProceduralTask: true,
      })
    );
    expect(result.classification).toBe("MINIMAL_RISK");
    const oblIds = result.obligations.map((o) => o.id);
    expect(oblIds).toContain("DOCUMENT_NON_HIGH_RISK");
    expect(oblIds).toContain("REGISTER_NON_HIGH_RISK");
  });

  it("should include warnings about narrow interpretation and market surveillance", () => {
    const result = classifyAISystem(
      baseAnswers({
        educationUseCase: true,
        posesSignificantRiskOfHarm: false,
        narrowProceduralTask: true,
      })
    );
    expect(result.warnings.join(" ")).toContain("narrowly interpreted");
  });
});

// ============================================================================
// 8. LIMITED RISK — TRANSPARENCY (Article 50)
// ============================================================================

describe("Limited Risk — Transparency (Art 50)", () => {
  it("should classify as LIMITED_RISK when interacting with humans", () => {
    const result = classifyAISystem(
      baseAnswers({ interactsWithHumans: true })
    );
    expect(result.classification).toBe("LIMITED_RISK");
    expect(result.transparencyObligations).toContain("HUMAN_INTERACTION");
    const obl = result.obligations.find((o) => o.id === "TRANSPARENCY_INTERACTION");
    expect(obl).toBeDefined();
    expect(obl!.article).toBe("Article 50(1)");
  });

  it("should classify as LIMITED_RISK when generating deepfakes", () => {
    const result = classifyAISystem(
      baseAnswers({ generatesDeepfakes: true })
    );
    expect(result.classification).toBe("LIMITED_RISK");
    expect(result.transparencyObligations).toContain("DEEPFAKE_CONTENT");
    const obl = result.obligations.find((o) => o.id === "TRANSPARENCY_DEEPFAKE");
    expect(obl).toBeDefined();
    expect(obl!.priority).toBe("CRITICAL");
  });

  it("should classify as LIMITED_RISK when generating text", () => {
    const result = classifyAISystem(
      baseAnswers({ generatesText: true })
    );
    expect(result.classification).toBe("LIMITED_RISK");
    expect(result.transparencyObligations).toContain("AI_GENERATED_TEXT");
  });

  it("should classify as LIMITED_RISK when generating media", () => {
    const result = classifyAISystem(
      baseAnswers({ generatesMedia: true })
    );
    expect(result.classification).toBe("LIMITED_RISK");
    expect(result.transparencyObligations).toContain("AI_GENERATED_MEDIA");
  });

  it("should classify as LIMITED_RISK when using emotion recognition (non-prohibited)", () => {
    const result = classifyAISystem(
      baseAnswers({ usesEmotionRecognition: true })
    );
    expect(result.classification).toBe("LIMITED_RISK");
    expect(result.transparencyObligations).toContain("EMOTION_RECOGNITION");
  });

  it("should classify as LIMITED_RISK when using biometric categorisation (non-prohibited)", () => {
    const result = classifyAISystem(
      baseAnswers({ usesBiometricCategorisation: true })
    );
    expect(result.classification).toBe("LIMITED_RISK");
    expect(result.transparencyObligations).toContain("BIOMETRIC_CATEGORISATION");
  });

  it("should list multiple transparency obligations when several apply", () => {
    const result = classifyAISystem(
      baseAnswers({
        interactsWithHumans: true,
        generatesDeepfakes: true,
        generatesText: true,
        generatesMedia: true,
      })
    );
    expect(result.classification).toBe("LIMITED_RISK");
    expect(result.transparencyObligations!.length).toBe(4);
    expect(result.transparencyObligations).toContain("HUMAN_INTERACTION");
    expect(result.transparencyObligations).toContain("DEEPFAKE_CONTENT");
    expect(result.transparencyObligations).toContain("AI_GENERATED_TEXT");
    expect(result.transparencyObligations).toContain("AI_GENERATED_MEDIA");
  });

  it("should have enforcement deadline 2026-08-02", () => {
    const result = classifyAISystem(
      baseAnswers({ interactsWithHumans: true })
    );
    expect(result.enforcementDeadline).toBe("2026-08-02");
    expect(result.legalBasis).toContain("Article 50");
  });
});

// ============================================================================
// 9. ROLE-BASED OBLIGATIONS (Provider vs Deployer vs Both)
// ============================================================================

describe("Role-based obligations", () => {
  describe("PROVIDER high-risk obligations", () => {
    it("should include 16 provider-specific obligations", () => {
      const result = classifyAISystem(
        baseAnswers({
          role: "PROVIDER",
          educationUseCase: true,
        })
      );
      expect(result.classification).toBe("HIGH_RISK");
      const providerObls = result.obligations.filter(
        (o) => o.appliesToRole === "PROVIDER" || o.appliesToRole === "BOTH"
      );
      // Provider gets: risk management, data governance, tech doc, record keeping,
      // transparency to deployers, human oversight, accuracy/robustness, QMS,
      // doc keeping 10yr, auto log retention, corrective actions, conformity assessment,
      // EU declaration, CE marking, EU DB registration, post-market monitoring,
      // serious incident reporting, AI literacy
      expect(providerObls.length).toBeGreaterThanOrEqual(16);
    });

    it("should NOT include deployer-specific obligations for PROVIDER role", () => {
      const result = classifyAISystem(
        baseAnswers({
          role: "PROVIDER",
          educationUseCase: true,
        })
      );
      const deployerOnly = result.obligations.filter(
        (o) => o.appliesToRole === "DEPLOYER"
      );
      expect(deployerOnly.length).toBe(0);
    });
  });

  describe("DEPLOYER high-risk obligations", () => {
    it("should include deployer-specific obligations (Art 26)", () => {
      const result = classifyAISystem(
        baseAnswers({
          role: "DEPLOYER",
          educationUseCase: true,
        })
      );
      expect(result.classification).toBe("HIGH_RISK");
      const oblIds = result.obligations.map((o) => o.id);
      expect(oblIds).toContain("DEPLOY_PER_INSTRUCTIONS");
      expect(oblIds).toContain("ASSIGN_HUMAN_OVERSIGHT");
      expect(oblIds).toContain("MONITOR_OPERATIONS");
      expect(oblIds).toContain("KEEP_DEPLOYER_LOGS");
      expect(oblIds).toContain("INFORM_WORKERS");
      expect(oblIds).toContain("INFORM_AFFECTED_PERSONS");
      expect(oblIds).toContain("DPIA_IF_APPLICABLE");
      expect(oblIds).toContain("DEPLOYER_REGISTRATION");
    });

    it("should NOT include provider-specific obligations for DEPLOYER role", () => {
      const result = classifyAISystem(
        baseAnswers({
          role: "DEPLOYER",
          educationUseCase: true,
        })
      );
      const providerOnly = result.obligations.filter(
        (o) => o.appliesToRole === "PROVIDER"
      );
      expect(providerOnly.length).toBe(0);
    });

    it("should include FRIA for applicable areas (education, employment, essential services, LE, migration, justice)", () => {
      const areasWithFRIA = [
        "educationUseCase",
        "employmentUseCase",
        "essentialServicesUseCase",
        "lawEnforcementUseCase",
        "migrationUseCase",
        "justiceUseCase",
      ] as const;

      for (const area of areasWithFRIA) {
        const result = classifyAISystem(
          baseAnswers({ role: "DEPLOYER", [area]: true })
        );
        const fria = result.obligations.find(
          (o) => o.id === "FUNDAMENTAL_RIGHTS_IMPACT"
        );
        expect(fria).toBeDefined();
      }
    });
  });

  describe("BOTH role", () => {
    it("should include BOTH provider AND deployer obligations", () => {
      const result = classifyAISystem(
        baseAnswers({
          role: "BOTH",
          educationUseCase: true,
        })
      );
      expect(result.classification).toBe("HIGH_RISK");
      const oblIds = result.obligations.map((o) => o.id);
      // Provider obligations
      expect(oblIds).toContain("RISK_MANAGEMENT_SYSTEM");
      expect(oblIds).toContain("TECHNICAL_DOCUMENTATION");
      expect(oblIds).toContain("CONFORMITY_ASSESSMENT");
      // Deployer obligations
      expect(oblIds).toContain("DEPLOY_PER_INSTRUCTIONS");
      expect(oblIds).toContain("ASSIGN_HUMAN_OVERSIGHT");
      // FRIA
      expect(oblIds).toContain("FUNDAMENTAL_RIGHTS_IMPACT");
    });
  });
});

// ============================================================================
// 10. SME-AWARE FINE CALCULATIONS
// ============================================================================

describe("SME-aware fine calculations", () => {
  describe("PROHIBITED tier (€35M / 7%)", () => {
    it("LARGE company: fixed €35M", () => {
      const result = classifyAISystem(
        baseAnswers({ socialScoring: true, companySize: "LARGE" })
      );
      expect(result.fineRisk.maxAmountGeneral).toBe("€35,000,000");
      expect(result.fineRisk.maxPercentTurnover).toBe(7);
      expect(result.fineRisk.maxAmountSME).toBe("€35,000,000");
    });

    it("SME company: lower of €35M or 7% (substantially lower)", () => {
      for (const size of ["MICRO", "SMALL", "MEDIUM"] as const) {
        const result = classifyAISystem(
          baseAnswers({ socialScoring: true, companySize: size })
        );
        expect(result.fineRisk.maxAmountGeneral).toBe("€35,000,000");
        expect(result.fineRisk.maxPercentTurnover).toBe(7);
        expect(result.fineRisk.maxAmountSME).toContain("LOWER");
      }
    });
  });

  describe("HIGH_RISK tier (€15M / 3%)", () => {
    it("LARGE company: fixed €15M", () => {
      const result = classifyAISystem(
        baseAnswers({ educationUseCase: true, companySize: "LARGE" })
      );
      expect(result.fineRisk.maxAmountGeneral).toBe("€15,000,000");
      expect(result.fineRisk.maxPercentTurnover).toBe(3);
      expect(result.fineRisk.maxAmountSME).toBe("€15,000,000");
    });

    it("SME company: lower of €15M or 3%", () => {
      for (const size of ["MICRO", "SMALL", "MEDIUM"] as const) {
        const result = classifyAISystem(
          baseAnswers({ educationUseCase: true, companySize: size })
        );
        expect(result.fineRisk.maxAmountSME).toContain("LOWER");
      }
    });
  });

  describe("GPAI tier (€15M / 3%)", () => {
    it("should have GPAI fine tier", () => {
      const result = classifyAISystem(
        baseAnswers({ isGeneralPurposeModel: true, companySize: "LARGE" })
      );
      expect(result.fineRisk.maxAmountGeneral).toBe("€15,000,000");
      expect(result.fineRisk.maxPercentTurnover).toBe(3);
      expect(result.fineRisk.article).toBe("Article 101(1)");
    });
  });

  describe("SME simplifications for MICRO enterprises", () => {
    it("should get extra QMS simplification for micro-enterprises", () => {
      const result = classifyAISystem(
        baseAnswers({
          educationUseCase: true,
          companySize: "MICRO",
        })
      );
      expect(result.smeSimplifications.join(" ")).toContain("Microenterprise");
      expect(result.smeSimplifications.join(" ")).toContain("simplified");
    });

    it("should NOT have simplifications for LARGE companies", () => {
      const result = classifyAISystem(
        baseAnswers({
          educationUseCase: true,
          companySize: "LARGE",
        })
      );
      expect(result.smeSimplifications.length).toBe(0);
    });
  });
});

// ============================================================================
// 11. ENFORCEMENT TIMELINE
// ============================================================================

describe("Enforcement Timeline (getEnforcementTimeline)", () => {
  it("should return 6 milestones", () => {
    const timeline = getEnforcementTimeline(new Date("2024-01-01"));
    expect(timeline.length).toBe(6);
  });

  it("should mark milestones as ENFORCED when date has passed", () => {
    const timeline = getEnforcementTimeline(new Date("2025-06-01"));
    const prohibitedMilestone = timeline.find((m) =>
      m.label.includes("Prohibited")
    );
    expect(prohibitedMilestone!.status).toBe("ENFORCED");
    expect(prohibitedMilestone!.daysUntil).toBe(0);
  });

  it("should mark milestones as UPCOMING when date is in future", () => {
    const timeline = getEnforcementTimeline(new Date("2024-01-01"));
    expect(timeline.every((m) => m.status === "UPCOMING")).toBe(true);
  });

  it("should calculate daysUntil correctly", () => {
    // 2025-02-02 is 33 days from 2025-01-01
    const timeline = getEnforcementTimeline(new Date("2025-01-01"));
    const prohibited = timeline.find((m) =>
      m.label.includes("Prohibited")
    );
    expect(prohibited!.daysUntil).toBeGreaterThan(30);
    expect(prohibited!.daysUntil).toBeLessThan(35);
  });

  it("should have correct order of dates", () => {
    const timeline = getEnforcementTimeline();
    for (let i = 1; i < timeline.length; i++) {
      expect(new Date(timeline[i].dateString).getTime()).toBeGreaterThan(
        new Date(timeline[i - 1].dateString).getTime()
      );
    }
  });
});

// ============================================================================
// 12. CLASSIFICATION PRIORITY ORDER
// ============================================================================

describe("Classification Priority Order", () => {
  it("scope exclusion > prohibited", () => {
    const result = classifyAISystem(
      baseAnswers({
        militaryDefenceOnly: true,
        socialScoring: true,
      })
    );
    expect(result.classification).toBe("MINIMAL_RISK"); // excluded, not prohibited
  });

  it("prohibited > GPAI", () => {
    const result = classifyAISystem(
      baseAnswers({
        socialScoring: true,
        isGeneralPurposeModel: true,
      })
    );
    expect(result.classification).toBe("PROHIBITED");
  });

  it("prohibited > high-risk", () => {
    const result = classifyAISystem(
      baseAnswers({
        socialScoring: true,
        educationUseCase: true,
      })
    );
    expect(result.classification).toBe("PROHIBITED");
  });

  it("GPAI > high-risk safety component", () => {
    const result = classifyAISystem(
      baseAnswers({
        isGeneralPurposeModel: true,
        isSafetyComponent: true,
        productUnderAnnexI: true,
        requiresThirdPartyConformity: true,
      })
    );
    expect(result.classification).toBe("GPAI");
  });

  it("GPAI > Annex III high-risk", () => {
    const result = classifyAISystem(
      baseAnswers({
        isGeneralPurposeModel: true,
        educationUseCase: true,
      })
    );
    expect(result.classification).toBe("GPAI");
  });

  it("high-risk safety > Annex III", () => {
    const result = classifyAISystem(
      baseAnswers({
        isSafetyComponent: true,
        productUnderAnnexI: true,
        requiresThirdPartyConformity: true,
        educationUseCase: true,
      })
    );
    expect(result.classification).toBe("HIGH_RISK");
    // Safety component is checked first, so legalBasis should reference Art 6(1)
    expect(result.legalBasis).toContain("Article 6(1)");
  });

  it("high-risk > limited risk", () => {
    const result = classifyAISystem(
      baseAnswers({
        educationUseCase: true,
        interactsWithHumans: true,
      })
    );
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("limited risk > minimal risk", () => {
    const result = classifyAISystem(
      baseAnswers({ interactsWithHumans: true })
    );
    expect(result.classification).toBe("LIMITED_RISK");
  });
});

// ============================================================================
// 13. REAL-WORLD SCENARIO TESTS
// ============================================================================

describe("Real-world scenarios", () => {
  it("SCENARIO: Customer service chatbot (LIMITED_RISK)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "DEPLOYER",
        systemDescription: "Customer service chatbot for an e-commerce store",
        interactsWithHumans: true,
        generatesText: true,
      })
    );
    expect(result.classification).toBe("LIMITED_RISK");
    expect(result.transparencyObligations).toContain("HUMAN_INTERACTION");
    expect(result.transparencyObligations).toContain("AI_GENERATED_TEXT");
  });

  it("SCENARIO: CV/resume screening tool (HIGH_RISK — Employment)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "PROVIDER",
        systemDescription: "AI tool that screens CVs and ranks candidates",
        employmentUseCase: true,
        employmentType: "RECRUITMENT_SELECTION",
      })
    );
    expect(result.classification).toBe("HIGH_RISK");
    expect(result.highRiskArea).toBe("EMPLOYMENT");
  });

  it("SCENARIO: Face unlock on phone (NOT high-risk — biometric verification excluded)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "PROVIDER",
        systemDescription: "Facial recognition for phone unlock",
        usesBiometrics: true,
        biometricType: "REMOTE_IDENTIFICATION",
        isBiometricVerificationOnly: true,
      })
    );
    expect(result.classification).not.toBe("HIGH_RISK");
  });

  it("SCENARIO: Deepfake video generator (LIMITED_RISK)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "PROVIDER",
        systemDescription: "AI that generates realistic video of people",
        generatesDeepfakes: true,
        generatesMedia: true,
      })
    );
    expect(result.classification).toBe("LIMITED_RISK");
    expect(result.transparencyObligations).toContain("DEEPFAKE_CONTENT");
    expect(result.transparencyObligations).toContain("AI_GENERATED_MEDIA");
  });

  it("SCENARIO: China-style social credit system (PROHIBITED)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "PROVIDER",
        systemDescription: "Government social credit scoring system",
        socialScoring: true,
      })
    );
    expect(result.classification).toBe("PROHIBITED");
    expect(result.fineRisk.maxPercentTurnover).toBe(7);
  });

  it("SCENARIO: GPT-4-class model (GPAI_SYSTEMIC)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "PROVIDER",
        systemDescription: "Large language model with 10^26 FLOPs training compute",
        isGeneralPurposeModel: true,
        gpaiTrainingCompute: 1e26,
        gpaiOpenSource: false,
      })
    );
    expect(result.classification).toBe("GPAI_SYSTEMIC");
  });

  it("SCENARIO: Llama-class open-source model (GPAI with partial exemption)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "PROVIDER",
        systemDescription: "Open-source LLM with moderate compute",
        isGeneralPurposeModel: true,
        gpaiTrainingCompute: 1e23,
        gpaiOpenSource: true,
        gpaiHighImpactCapabilities: false,
      })
    );
    expect(result.classification).toBe("GPAI");
    const oblIds = result.obligations.map((o) => o.id);
    expect(oblIds).not.toContain("GPAI_TECHNICAL_DOC");
    expect(oblIds).toContain("GPAI_COPYRIGHT_POLICY");
  });

  it("SCENARIO: Fraud detection AI (NOT high-risk — explicitly excluded from Annex III point 5)", () => {
    // Fraud detection is NOT creditworthiness or credit scoring
    const result = classifyAISystem(
      baseAnswers({
        role: "PROVIDER",
        systemDescription: "AI for detecting fraudulent credit card transactions",
        // essentialServicesUseCase should be FALSE for fraud detection
        essentialServicesUseCase: false,
      })
    );
    expect(result.classification).not.toBe("HIGH_RISK");
  });

  it("SCENARIO: School emotion monitoring (PROHIBITED)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "DEPLOYER",
        systemDescription: "Emotion AI monitoring students during lessons",
        workplaceEmotionDetection: true,
        workplaceEmotionForMedicalSafety: false,
      })
    );
    expect(result.classification).toBe("PROHIBITED");
  });

  it("SCENARIO: Driver drowsiness detection (exception — NOT prohibited)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "PROVIDER",
        systemDescription: "AI detecting driver drowsiness for safety alerts",
        workplaceEmotionDetection: true,
        workplaceEmotionForMedicalSafety: true, // Medical/safety exception
      })
    );
    expect(result.classification).not.toBe("PROHIBITED");
  });

  it("SCENARIO: AI judge/sentencing tool (HIGH_RISK — Justice)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "DEPLOYER",
        systemDescription: "AI system assisting judges in applying law to facts",
        justiceUseCase: true,
        justiceType: "COURT_RESEARCH_APPLICATION",
      })
    );
    expect(result.classification).toBe("HIGH_RISK");
    expect(result.highRiskArea).toBe("JUSTICE_DEMOCRACY");
  });

  it("SCENARIO: US-only AI company (EXCLUDED — no EU nexus)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "PROVIDER",
        systemDescription: "AI product sold only in the US market",
        isEUBased: false,
        outputUsedInEU: false,
      })
    );
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.nextSteps.join(" ")).toContain("OUTSIDE THE SCOPE");
  });

  it("SCENARIO: Military drone AI (EXCLUDED — national security)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "PROVIDER",
        systemDescription: "Autonomous target identification for military drone",
        militaryDefenceOnly: true,
        // Even with prohibited triggers, military exclusion should take priority
        socialScoring: true,
      })
    );
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.nextSteps.join(" ")).toContain("OUTSIDE THE SCOPE");
  });

  it("SCENARIO: AI credit scoring (HIGH_RISK, not fraud detection)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "PROVIDER",
        systemDescription: "AI system that determines consumer credit scores",
        essentialServicesUseCase: true,
        essentialServiceType: "CREDIT_SCORING",
      })
    );
    expect(result.classification).toBe("HIGH_RISK");
    expect(result.highRiskArea).toBe("ESSENTIAL_SERVICES");
  });

  it("SCENARIO: Emergency dispatch prioritization AI (HIGH_RISK)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "DEPLOYER",
        systemDescription: "AI to prioritize emergency calls for dispatch",
        essentialServicesUseCase: true,
        essentialServiceType: "EMERGENCY_DISPATCH",
      })
    );
    expect(result.classification).toBe("HIGH_RISK");
    expect(result.highRiskArea).toBe("ESSENTIAL_SERVICES");
  });

  it("SCENARIO: Election influence AI (HIGH_RISK — Justice & Democracy)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "PROVIDER",
        systemDescription: "AI targeting voters with personalized political content",
        justiceUseCase: true,
        justiceType: "ELECTION_INFLUENCE",
      })
    );
    expect(result.classification).toBe("HIGH_RISK");
    expect(result.highRiskArea).toBe("JUSTICE_DEMOCRACY");
  });
});

// ============================================================================
// 14. HIGH-RISK AREA WARNINGS
// ============================================================================

describe("High-risk area-specific warnings", () => {
  it("LAW_ENFORCEMENT and MIGRATION should warn about secure non-public DB", () => {
    for (const area of ["lawEnforcementUseCase", "migrationUseCase"] as const) {
      const result = classifyAISystem(baseAnswers({ [area]: true }));
      expect(result.warnings.join(" ")).toContain("SECURE NON-PUBLIC");
    }
  });

  it("EMPLOYMENT should warn about GDPR DPIA", () => {
    const result = classifyAISystem(
      baseAnswers({ employmentUseCase: true })
    );
    expect(result.warnings.join(" ")).toContain("Data Protection Impact Assessment");
  });

  it("ESSENTIAL_SERVICES should warn about fraud detection exclusion", () => {
    const result = classifyAISystem(
      baseAnswers({ essentialServicesUseCase: true })
    );
    expect(result.warnings.join(" ")).toContain("fraud detection");
  });

  it("BIOMETRICS should warn about verification exclusion", () => {
    const result = classifyAISystem(
      baseAnswers({
        usesBiometrics: true,
        biometricType: "REMOTE_IDENTIFICATION",
        isBiometricVerificationOnly: false,
      })
    );
    expect(result.warnings.join(" ")).toContain("VERIFICATION");
  });
});

// ============================================================================
// 15. CONFORMITY ASSESSMENT DESCRIPTION (internal check)
// ============================================================================

describe("Conformity assessment routing", () => {
  it("BIOMETRICS should reference notified body option (Annex VII)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "PROVIDER",
        usesBiometrics: true,
        biometricType: "REMOTE_IDENTIFICATION",
        isBiometricVerificationOnly: false,
      })
    );
    const conformity = result.obligations.find(
      (o) => o.id === "CONFORMITY_ASSESSMENT"
    );
    expect(conformity).toBeDefined();
    expect(conformity!.description).toContain("notified body");
  });

  it("Non-biometric Annex III areas should reference internal control (Annex VI)", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "PROVIDER",
        educationUseCase: true,
      })
    );
    const conformity = result.obligations.find(
      (o) => o.id === "CONFORMITY_ASSESSMENT"
    );
    expect(conformity).toBeDefined();
    expect(conformity!.description).toContain("Internal control");
  });

  it("PRODUCT_SAFETY should reference product legislation", () => {
    const result = classifyAISystem(
      baseAnswers({
        role: "PROVIDER",
        isSafetyComponent: true,
        productUnderAnnexI: true,
        requiresThirdPartyConformity: true,
      })
    );
    const conformity = result.obligations.find(
      (o) => o.id === "CONFORMITY_ASSESSMENT"
    );
    expect(conformity).toBeDefined();
    expect(conformity!.description).toContain("product legislation");
  });
});

// ============================================================================
// 16. EDGE CASES & BOUNDARY CONDITIONS
// ============================================================================

describe("Edge cases", () => {
  it("all prohibited practices at once should list all 8 violations", () => {
    const result = classifyAISystem(
      baseAnswers({
        usesSubliminaManipulation: true,
        manipulationCausesSignificantHarm: true,
        exploitsVulnerabilities: true,
        exploitationCausesSignificantHarm: true,
        socialScoring: true,
        criminalRiskProfiling: true,
        crimeProfilingBasedSolelyOnPersonality: true,
        crimeProfilingSupportingHumanAssessment: false,
        facialRecognitionScraping: true,
        workplaceEmotionDetection: true,
        workplaceEmotionForMedicalSafety: false,
        biometricCategorisationSensitive: true,
        biometricCatForLawEnforcementLabelling: false,
        realtimeBiometricPublicSpaces: true,
        realtimeBiometricForLEException: false,
      })
    );
    expect(result.classification).toBe("PROHIBITED");
    expect(result.prohibitedPractices!.length).toBe(8);
  });

  it("all Annex III areas at once should be HIGH_RISK (last one wins for highRiskArea)", () => {
    const result = classifyAISystem(
      baseAnswers({
        usesBiometrics: true,
        biometricType: "REMOTE_IDENTIFICATION",
        isBiometricVerificationOnly: false,
        criticalInfrastructure: true,
        educationUseCase: true,
        employmentUseCase: true,
        essentialServicesUseCase: true,
        lawEnforcementUseCase: true,
        migrationUseCase: true,
        justiceUseCase: true,
      })
    );
    expect(result.classification).toBe("HIGH_RISK");
    // justiceUseCase is listed last, so it should be the highRiskArea
    expect(result.highRiskArea).toBe("JUSTICE_DEMOCRACY");
  });

  it("all 6 transparency triggers should produce 6 obligations in LIMITED_RISK", () => {
    const result = classifyAISystem(
      baseAnswers({
        interactsWithHumans: true,
        generatesDeepfakes: true,
        generatesText: true,
        generatesMedia: true,
        usesEmotionRecognition: true,
        usesBiometricCategorisation: true,
      })
    );
    expect(result.classification).toBe("LIMITED_RISK");
    expect(result.transparencyObligations!.length).toBe(6);
  });

  it("GPAI compute boundary: 9.99e24 should be standard GPAI", () => {
    const result = classifyAISystem(
      baseAnswers({
        isGeneralPurposeModel: true,
        gpaiTrainingCompute: 9.99e24,
        gpaiHighImpactCapabilities: false,
      })
    );
    expect(result.classification).toBe("GPAI");
  });

  it("GPAI compute boundary: 1.01e25 should be GPAI_SYSTEMIC", () => {
    const result = classifyAISystem(
      baseAnswers({
        isGeneralPurposeModel: true,
        gpaiTrainingCompute: 1.01e25,
        gpaiHighImpactCapabilities: false,
      })
    );
    expect(result.classification).toBe("GPAI_SYSTEMIC");
  });

  it("company with all exceptions active for prohibited practice bypasses each one", () => {
    // All prohibited flags set, but all exceptions also set = nothing prohibited
    const result = classifyAISystem(
      baseAnswers({
        usesSubliminaManipulation: true,
        manipulationCausesSignificantHarm: false,       // No significant harm
        exploitsVulnerabilities: true,
        exploitationCausesSignificantHarm: false,       // No significant harm
        criminalRiskProfiling: true,
        crimeProfilingBasedSolelyOnPersonality: true,
        crimeProfilingSupportingHumanAssessment: true,   // Exception
        workplaceEmotionDetection: true,
        workplaceEmotionForMedicalSafety: true,         // Medical exception
        biometricCategorisationSensitive: true,
        biometricCatForLawEnforcementLabelling: true,   // LE exception
        realtimeBiometricPublicSpaces: true,
        realtimeBiometricForLEException: true,
        realtimeBiometricHasJudicialAuth: true,         // Judicial auth
      })
    );
    expect(result.classification).not.toBe("PROHIBITED");
  });
});

// ============================================================================
// 17. OUTPUT STRUCTURE VALIDATION
// ============================================================================

describe("ClassificationResult structure", () => {
  it("every classification should have all required fields", () => {
    const scenarios: Partial<WizardAnswers>[] = [
      {},                                                    // MINIMAL_RISK
      { militaryDefenceOnly: true },                         // EXCLUDED
      { socialScoring: true },                               // PROHIBITED
      { isGeneralPurposeModel: true },                       // GPAI
      { isGeneralPurposeModel: true, gpaiHighImpactCapabilities: true }, // GPAI_SYSTEMIC
      { isSafetyComponent: true, productUnderAnnexI: true, requiresThirdPartyConformity: true }, // HIGH_RISK safety
      { educationUseCase: true },                            // HIGH_RISK Annex III
      { interactsWithHumans: true },                         // LIMITED_RISK
    ];

    for (const overrides of scenarios) {
      const result = classifyAISystem(baseAnswers(overrides));

      // Required fields
      expect(result.classification).toBeDefined();
      expect(result.role).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.legalBasis).toBeDefined();
      expect(Array.isArray(result.legalBasis)).toBe(true);
      expect(result.obligations).toBeDefined();
      expect(Array.isArray(result.obligations)).toBe(true);
      expect(result.enforcementDeadline).toBeDefined();
      expect(result.fineRisk).toBeDefined();
      expect(result.nextSteps).toBeDefined();
      expect(Array.isArray(result.nextSteps)).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.smeSimplifications).toBeDefined();
      expect(Array.isArray(result.smeSimplifications)).toBe(true);

      // FineRisk structure
      expect(result.fineRisk.maxAmountGeneral).toBeDefined();
      expect(result.fineRisk.maxAmountSME).toBeDefined();
      expect(typeof result.fineRisk.maxPercentTurnover).toBe("number");
      expect(result.fineRisk.article).toBeDefined();
    }
  });

  it("classification field should only contain valid values", () => {
    const validClassifications: RiskClassification[] = [
      "PROHIBITED",
      "HIGH_RISK",
      "LIMITED_RISK",
      "GPAI",
      "GPAI_SYSTEMIC",
      "MINIMAL_RISK",
    ];

    const scenarios: Partial<WizardAnswers>[] = [
      {},
      { socialScoring: true },
      { isGeneralPurposeModel: true },
      { isGeneralPurposeModel: true, gpaiHighImpactCapabilities: true },
      { educationUseCase: true },
      { interactsWithHumans: true },
    ];

    for (const overrides of scenarios) {
      const result = classifyAISystem(baseAnswers(overrides));
      expect(validClassifications).toContain(result.classification);
    }
  });

  it("obligation deadlines should be valid date strings", () => {
    const result = classifyAISystem(
      baseAnswers({ educationUseCase: true })
    );
    for (const obl of result.obligations) {
      if (obl.deadline) {
        expect(new Date(obl.deadline).toString()).not.toBe("Invalid Date");
      }
    }
  });
});
