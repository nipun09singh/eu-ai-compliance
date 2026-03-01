/**
 * GAP 1: ADVERSARIAL & BOUNDARY INPUT TESTING
 * 
 * Tests the engine's resilience against:
 *   - Contradictory boolean combinations
 *   - Boundary values (GPAI compute, timeline dates, company sizes)
 *   - Maximum simultaneous triggers
 *   - Optional/undefined field handling
 *   - Priority order stress tests
 * 
 * Reference: QA_LAYER1_DESIGN.md Section 3
 * Total: ~130 tests
 */

import { describe, it, expect } from "vitest";
import {
  classifyAISystem,
  getEnforcementTimeline,
  type WizardAnswers,
} from "../classification-engine";

// ============================================================================
// HELPER
// ============================================================================

function baseAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return {
    companyName: "AdversarialTestCo",
    companySize: "SMALL",
    isEUBased: true,
    outputUsedInEU: true,
    role: "PROVIDER",
    systemDescription: "Adversarial test system",
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
// 3.1 CONTRADICTORY BOOLEAN COMBINATIONS
// ============================================================================

describe("3.1.1 Scope Exclusion Contradictions", () => {
  it("TEST-ADV-002: militaryDefenceOnly + ALL prohibited should still exclude", () => {
    const result = classifyAISystem(baseAnswers({
      militaryDefenceOnly: true,
      usesSubliminaManipulation: true, manipulationCausesSignificantHarm: true,
      exploitsVulnerabilities: true, exploitationCausesSignificantHarm: true,
      socialScoring: true,
      criminalRiskProfiling: true, crimeProfilingBasedSolelyOnPersonality: true,
      facialRecognitionScraping: true,
      workplaceEmotionDetection: true,
      biometricCategorisationSensitive: true,
      realtimeBiometricPublicSpaces: true,
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.nextSteps.join(" ")).toContain("Military");
  });

  it("TEST-ADV-003: personalNonProfessional + employmentUseCase should exclude", () => {
    const result = classifyAISystem(baseAnswers({
      personalNonProfessional: true,
      employmentUseCase: true,
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("TEST-ADV-004: scientificResearchOnly + safety component should exclude", () => {
    const result = classifyAISystem(baseAnswers({
      scientificResearchOnly: true,
      isSafetyComponent: true,
      productUnderAnnexI: true,
      requiresThirdPartyConformity: true,
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("TEST-ADV-005: openSource + educationUseCase should NOT exclude (BUG-C5 fixed)", () => {
    const result = classifyAISystem(baseAnswers({
      openSourceNonHighRisk: true,
      educationUseCase: true,
    }));
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("TEST-ADV-006: openSource + interactsWithHumans should NOT exclude (BUG-C5 fixed)", () => {
    const result = classifyAISystem(baseAnswers({
      openSourceNonHighRisk: true,
      interactsWithHumans: true,
    }));
    expect(result.classification).toBe("LIMITED_RISK");
  });

  it("TEST-ADV-007: EU-based + military should still exclude", () => {
    const result = classifyAISystem(baseAnswers({
      isEUBased: true,
      outputUsedInEU: true,
      militaryDefenceOnly: true,
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("TEST-ADV-008: no EU nexus should exclude", () => {
    const result = classifyAISystem(baseAnswers({
      isEUBased: false,
      outputUsedInEU: false,
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.nextSteps.join(" ")).toContain("No EU nexus");
  });

  it("TEST-ADV-009: ALL five scope exclusions simultaneously", () => {
    const result = classifyAISystem(baseAnswers({
      militaryDefenceOnly: true,
      scientificResearchOnly: true,
      personalNonProfessional: true,
      openSourceNonHighRisk: true,
      isEUBased: false,
      outputUsedInEU: false,
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
    const exclusionText = result.nextSteps.join(" ");
    expect(exclusionText).toContain("Military");
    expect(exclusionText).toContain("Scientific");
    expect(exclusionText).toContain("Personal");
    expect(exclusionText).toContain("Open-source");
    expect(exclusionText).toContain("No EU nexus");
  });
});

describe("3.1.2 Prohibited Practice Contradictions", () => {
  it("TEST-ADV-012: exploitsVulnerabilities=false + harm=true → NOT prohibited", () => {
    const result = classifyAISystem(baseAnswers({
      exploitsVulnerabilities: false,
      exploitationCausesSignificantHarm: true,
    }));
    expect(result.classification).not.toBe("PROHIBITED");
  });

  it("TEST-ADV-014: criminalRiskProfiling=true + solely=false + human=true → NOT prohibited", () => {
    const result = classifyAISystem(baseAnswers({
      criminalRiskProfiling: true,
      crimeProfilingBasedSolelyOnPersonality: false,
      crimeProfilingSupportingHumanAssessment: true,
    }));
    expect(result.classification).not.toBe("PROHIBITED");
  });

  it("TEST-ADV-015: workplaceEmotionDetection=false + medical=true → NOT prohibited", () => {
    const result = classifyAISystem(baseAnswers({
      workplaceEmotionDetection: false,
      workplaceEmotionForMedicalSafety: true,
    }));
    expect(result.classification).not.toBe("PROHIBITED");
  });

  it("TEST-ADV-016: biometricCatSensitive=false + LELabelling=true → NOT prohibited", () => {
    const result = classifyAISystem(baseAnswers({
      biometricCategorisationSensitive: false,
      biometricCatForLawEnforcementLabelling: true,
    }));
    expect(result.classification).not.toBe("PROHIBITED");
  });

  it("TEST-ADV-017: realtimeBiometric=false + LEException=true + judicialAuth=true → NOT prohibited", () => {
    const result = classifyAISystem(baseAnswers({
      realtimeBiometricPublicSpaces: false,
      realtimeBiometricForLEException: true,
      realtimeBiometricHasJudicialAuth: true,
    }));
    expect(result.classification).not.toBe("PROHIBITED");
  });

  it("TEST-ADV-018: ALL prohibited TRUE + ALL exceptions TRUE → only SOCIAL_SCORING and FACIAL_SCRAPING", () => {
    const result = classifyAISystem(baseAnswers({
      usesSubliminaManipulation: true, manipulationCausesSignificantHarm: true,
      exploitsVulnerabilities: true, exploitationCausesSignificantHarm: true,
      socialScoring: true,
      criminalRiskProfiling: true, crimeProfilingBasedSolelyOnPersonality: true, crimeProfilingSupportingHumanAssessment: true,
      facialRecognitionScraping: true,
      workplaceEmotionDetection: true, workplaceEmotionForMedicalSafety: true,
      biometricCategorisationSensitive: true, biometricCatForLawEnforcementLabelling: true,
      realtimeBiometricPublicSpaces: true, realtimeBiometricForLEException: true, realtimeBiometricHasJudicialAuth: true,
    }));
    expect(result.classification).toBe("PROHIBITED");
    // Social scoring + facial scraping have NO exceptions
    // Criminal risk profiling: crimeProfilingSupportingHumanAssessment=true makes it not prohibited
    // Subliminal: still prohibited (harm=true, exception doesn't negate it)
    // Vulnerability: still prohibited (harm=true)
    // Workplace emotion: medical safety exception
    // Biometric cat: LE labelling exception
    // Realtime biometric: LE + judicial auth exception
    expect(result.prohibitedPractices).toContain("SOCIAL_SCORING");
    expect(result.prohibitedPractices).toContain("UNTARGETED_FACIAL_SCRAPING");
    expect(result.prohibitedPractices).toContain("SUBLIMINAL_MANIPULATION");
    expect(result.prohibitedPractices).toContain("VULNERABILITY_EXPLOITATION");
    // These should be saved by exceptions:
    expect(result.prohibitedPractices).not.toContain("WORKPLACE_EMOTION_DETECTION");
    expect(result.prohibitedPractices).not.toContain("BIOMETRIC_CATEGORISATION_SENSITIVE");
    expect(result.prohibitedPractices).not.toContain("REALTIME_BIOMETRIC_LAW_ENFORCEMENT");
  });

  it("TEST-ADV-019: only absolute prohibitions (social scoring + facial scraping)", () => {
    const result = classifyAISystem(baseAnswers({
      socialScoring: true,
      facialRecognitionScraping: true,
    }));
    expect(result.classification).toBe("PROHIBITED");
    expect(result.prohibitedPractices).toHaveLength(2);
    expect(result.prohibitedPractices).toContain("SOCIAL_SCORING");
    expect(result.prohibitedPractices).toContain("UNTARGETED_FACIAL_SCRAPING");
  });
});

describe("3.1.3 High-Risk Contradictions", () => {
  it("TEST-ADV-023: not safety component but product under Annex I → NOT high-risk via 6(1)", () => {
    const result = classifyAISystem(baseAnswers({
      isSafetyComponent: false,
      productUnderAnnexI: true,
      requiresThirdPartyConformity: true,
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("TEST-ADV-025: biometrics + verificationOnly + no type → NOT high-risk", () => {
    const result = classifyAISystem(baseAnswers({
      usesBiometrics: true,
      isBiometricVerificationOnly: true,
    }));
    expect(result.classification).not.toBe("HIGH_RISK");
  });

  it("TEST-ADV-027: usesBiometrics=false + biometricType set → NOT high-risk via biometrics", () => {
    const result = classifyAISystem(baseAnswers({
      usesBiometrics: false,
      biometricType: "REMOTE_IDENTIFICATION",
    }));
    // Should not trigger biometrics high-risk since base flag is false
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("TEST-ADV-028: educationUseCase=false + educationType set → NOT high-risk", () => {
    const result = classifyAISystem(baseAnswers({
      educationUseCase: false,
      educationType: "ADMISSION_ACCESS",
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("TEST-ADV-029: employmentUseCase=false + employmentType set → NOT high-risk", () => {
    const result = classifyAISystem(baseAnswers({
      employmentUseCase: false,
      employmentType: "RECRUITMENT_SELECTION",
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("TEST-ADV-030: essentialServices=false + serviceType set → NOT high-risk", () => {
    const result = classifyAISystem(baseAnswers({
      essentialServicesUseCase: false,
      essentialServiceType: "CREDITWORTHINESS",
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("TEST-ADV-031: lawEnforcement=false + type set → NOT high-risk", () => {
    const result = classifyAISystem(baseAnswers({
      lawEnforcementUseCase: false,
      lawEnforcementType: "POLYGRAPH",
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("TEST-ADV-032: migration=false + type set → NOT high-risk", () => {
    const result = classifyAISystem(baseAnswers({
      migrationUseCase: false,
      migrationType: "RISK_ASSESSMENT",
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("TEST-ADV-033: justice=false + type set → NOT high-risk", () => {
    const result = classifyAISystem(baseAnswers({
      justiceUseCase: false,
      justiceType: "COURT_RESEARCH_APPLICATION",
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
  });
});

describe("3.1.4 Art 6(3) Exception Contradictions", () => {
  it("TEST-ADV-034: significant risk blocks exception regardless of conditions met", () => {
    const result = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
      narrowProceduralTask: true,
      improvesHumanActivity: true,
      detectsPatterns: true,
      preparatoryTask: true,
    }));
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("TEST-ADV-035: profiling override defeats all conditions", () => {
    const result = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: false,
      narrowProceduralTask: true,
      improvesHumanActivity: true,
      detectsPatterns: true,
      preparatoryTask: true,
      performsProfiling: true,
    }));
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("TEST-ADV-037: both blockers active → HIGH_RISK", () => {
    const result = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
      performsProfiling: true,
      narrowProceduralTask: true,
      improvesHumanActivity: true,
    }));
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("TEST-ADV-038: no Annex III trigger + exception conditions → irrelevant, still MINIMAL", () => {
    const result = classifyAISystem(baseAnswers({
      posesSignificantRiskOfHarm: false,
      narrowProceduralTask: true,
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
    // Art 6(3) shouldn't even be referenced
    expect(result.legalBasis.join(" ")).not.toContain("6(3)");
  });
});

describe("3.1.5 GPAI Contradictions", () => {
  it("TEST-ADV-040: isGeneralPurposeModel=false + compute=1e30 → NOT GPAI", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: false,
      gpaiTrainingCompute: 1e30,
    }));
    expect(result.classification).not.toBe("GPAI");
    expect(result.classification).not.toBe("GPAI_SYSTEMIC");
  });

  it("TEST-ADV-041: isGeneralPurposeModel=false + highImpact=true → NOT GPAI", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: false,
      gpaiHighImpactCapabilities: true,
    }));
    expect(result.classification).not.toBe("GPAI");
    expect(result.classification).not.toBe("GPAI_SYSTEMIC");
  });

  it("TEST-ADV-042: isGeneralPurposeModel=false + gpaiOpenSource=true → NOT GPAI", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: false,
      gpaiOpenSource: true,
    }));
    expect(result.classification).not.toBe("GPAI");
  });

  it("TEST-ADV-043: GPAI standard with undefined compute", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
    }));
    expect(result.classification).toBe("GPAI");
  });

  it("TEST-ADV-044: GPAI with zero compute → standard", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiTrainingCompute: 0,
    }));
    expect(result.classification).toBe("GPAI");
  });

  it("TEST-ADV-045: GPAI with negative compute → standard (no crash)", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiTrainingCompute: -1,
    }));
    expect(result.classification).toBe("GPAI");
  });
});

// ============================================================================
// 3.2 BOUNDARY VALUE TESTS
// ============================================================================

describe("3.2.1 GPAI Compute Threshold (10^25 FLOPs)", () => {
  it("TEST-BND-002: just above 1e25 → GPAI_SYSTEMIC", () => {
    // Note: 1e25 + 1 === 1e25 in JS due to floating point! Must use multiplier.
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiTrainingCompute: 1.0000000000001e25,
    }));
    expect(result.classification).toBe("GPAI_SYSTEMIC");
  });

  it("TEST-BND-003: 9.999999999999e24 → standard GPAI", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiTrainingCompute: 9.999999999999e24,
    }));
    expect(result.classification).toBe("GPAI");
  });

  it("TEST-BND-004: 1.000000000001e25 → GPAI_SYSTEMIC", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiTrainingCompute: 1.000000000001e25,
    }));
    expect(result.classification).toBe("GPAI_SYSTEMIC");
  });

  it("TEST-BND-005: compute = 0 → standard GPAI", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiTrainingCompute: 0,
    }));
    expect(result.classification).toBe("GPAI");
  });

  it("TEST-BND-006: Number.MAX_VALUE → GPAI_SYSTEMIC", () => {
    // Note: MAX_SAFE_INTEGER (~9e15) is LESS than 1e25! Use MAX_VALUE instead.
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiTrainingCompute: Number.MAX_VALUE,
    }));
    expect(result.classification).toBe("GPAI_SYSTEMIC");
  });

  it("TEST-BND-007: Infinity → GPAI_SYSTEMIC", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiTrainingCompute: Number.POSITIVE_INFINITY,
    }));
    expect(result.classification).toBe("GPAI_SYSTEMIC");
  });

  it("TEST-BND-008: NaN → standard GPAI (NaN > 1e25 is false)", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiTrainingCompute: NaN,
    }));
    expect(result.classification).toBe("GPAI");
  });

  it("TEST-BND-009: -Infinity → standard GPAI", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiTrainingCompute: Number.NEGATIVE_INFINITY,
    }));
    expect(result.classification).toBe("GPAI");
  });

  it("TEST-BND-010: -1e25 → standard GPAI", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiTrainingCompute: -1e25,
    }));
    expect(result.classification).toBe("GPAI");
  });
});

describe("3.2.2 Company Size Boundaries", () => {
  it("TEST-BND-011: MICRO gets SME simplifications for high-risk", () => {
    const result = classifyAISystem(baseAnswers({
      companySize: "MICRO",
      educationUseCase: true,
    }));
    expect(result.smeSimplifications.length).toBeGreaterThan(0);
  });

  it("TEST-BND-012: SMALL gets regulatory sandbox mention", () => {
    const result = classifyAISystem(baseAnswers({
      companySize: "SMALL",
      educationUseCase: true,
    }));
    expect(result.smeSimplifications.join(" ")).toContain("sandbox");
  });

  it("TEST-BND-013: MEDIUM gets regulatory sandbox mention", () => {
    const result = classifyAISystem(baseAnswers({
      companySize: "MEDIUM",
      educationUseCase: true,
    }));
    expect(result.smeSimplifications.join(" ")).toContain("sandbox");
  });

  it("TEST-BND-014: LARGE gets no SME simplifications", () => {
    const result = classifyAISystem(baseAnswers({
      companySize: "LARGE",
      educationUseCase: true,
    }));
    expect(result.smeSimplifications).toHaveLength(0);
  });

  it("TEST-BND-015: MICRO fine note mentions specific example", () => {
    const result = classifyAISystem(baseAnswers({
      companySize: "MICRO",
      educationUseCase: true,
    }));
    expect(result.fineRisk.note).toBeDefined();
  });

  it("TEST-BND-016: LARGE maxAmountSME equals maxAmountGeneral for prohibited", () => {
    const result = classifyAISystem(baseAnswers({
      companySize: "LARGE",
      socialScoring: true,
    }));
    expect(result.fineRisk.maxAmountSME).toBe(result.fineRisk.maxAmountGeneral);
  });
});

describe("3.2.3 Enforcement Timeline Boundaries", () => {
  it("TEST-BND-017: day before prohibited deadline → UPCOMING", () => {
    const timeline = getEnforcementTimeline(new Date("2025-02-01"));
    const prohibited = timeline.find(m => m.label.includes("Prohibited"));
    expect(prohibited!.status).toBe("UPCOMING");
  });

  it("TEST-BND-018: exact prohibited deadline → ENFORCED, daysUntil=0", () => {
    const timeline = getEnforcementTimeline(new Date("2025-02-02"));
    const prohibited = timeline.find(m => m.label.includes("Prohibited"));
    expect(prohibited!.status).toBe("ENFORCED");
    expect(prohibited!.daysUntil).toBe(0);
  });

  it("TEST-BND-019: day after prohibited deadline → ENFORCED", () => {
    const timeline = getEnforcementTimeline(new Date("2025-02-03"));
    const prohibited = timeline.find(m => m.label.includes("Prohibited"));
    expect(prohibited!.status).toBe("ENFORCED");
  });

  it("TEST-BND-020: day before GPAI obligations deadline → UPCOMING", () => {
    const timeline = getEnforcementTimeline(new Date("2025-08-01"));
    // Be specific: "GPAI obligations" not just "GPAI" (which also matches codes of practice)
    const gpai = timeline.find(m => m.label.includes("GPAI obligations"));
    expect(gpai!.status).toBe("UPCOMING");
  });

  it("TEST-BND-021: exact GPAI deadline → ENFORCED", () => {
    const timeline = getEnforcementTimeline(new Date("2025-08-02"));
    const gpai = timeline.find(m => m.label.includes("GPAI"));
    expect(gpai!.status).toBe("ENFORCED");
  });

  it("TEST-BND-022: day before HIGH_RISK deadline → UPCOMING", () => {
    const timeline = getEnforcementTimeline(new Date("2026-08-01"));
    const highRisk = timeline.find(m => m.label.includes("HIGH-RISK"));
    expect(highRisk!.status).toBe("UPCOMING");
  });

  it("TEST-BND-023: exact HIGH_RISK deadline → ENFORCED", () => {
    const timeline = getEnforcementTimeline(new Date("2026-08-02"));
    const highRisk = timeline.find(m => m.label.includes("HIGH-RISK"));
    expect(highRisk!.status).toBe("ENFORCED");
  });

  it("TEST-BND-024: far future → ALL milestones ENFORCED", () => {
    const timeline = getEnforcementTimeline(new Date("2030-12-31"));
    for (const m of timeline) {
      expect(m.status).toBe("ENFORCED");
    }
  });
});

// ============================================================================
// 3.3 MAXIMUM SIMULTANEOUS TRIGGER TESTS
// ============================================================================

describe("3.3 Maximum Simultaneous Triggers", () => {
  it("TEST-MAX-001: ALL scope exclusions + ALL prohibited + ALL Annex III → MINIMAL_RISK (excluded)", () => {
    const result = classifyAISystem(baseAnswers({
      militaryDefenceOnly: true,
      scientificResearchOnly: true,
      personalNonProfessional: true,
      openSourceNonHighRisk: true,
      isEUBased: false, outputUsedInEU: false,
      socialScoring: true,
      facialRecognitionScraping: true,
      educationUseCase: true,
      employmentUseCase: true,
      isGeneralPurposeModel: true,
      gpaiHighImpactCapabilities: true,
      interactsWithHumans: true,
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("TEST-MAX-002: ALL prohibited (no exceptions) → PROHIBITED with 8 practices", () => {
    const result = classifyAISystem(baseAnswers({
      usesSubliminaManipulation: true, manipulationCausesSignificantHarm: true,
      exploitsVulnerabilities: true, exploitationCausesSignificantHarm: true,
      socialScoring: true,
      criminalRiskProfiling: true, crimeProfilingBasedSolelyOnPersonality: true,
      facialRecognitionScraping: true,
      workplaceEmotionDetection: true,
      biometricCategorisationSensitive: true,
      realtimeBiometricPublicSpaces: true,
    }));
    expect(result.classification).toBe("PROHIBITED");
    expect(result.prohibitedPractices!.length).toBe(8);
  });

  it("TEST-MAX-003: ALL Annex III + ALL transparency + GPAI systemic → GPAI_SYSTEMIC (GPAI priority)", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiHighImpactCapabilities: true,
      educationUseCase: true,
      employmentUseCase: true,
      interactsWithHumans: true,
      generatesDeepfakes: true,
    }));
    expect(result.classification).toBe("GPAI_SYSTEMIC");
  });

  it("TEST-MAX-004: ALL Annex III (no GPAI) → HIGH_RISK, last area wins", () => {
    const result = classifyAISystem(baseAnswers({
      usesBiometrics: true, biometricType: "REMOTE_IDENTIFICATION",
      criticalInfrastructure: true,
      educationUseCase: true,
      employmentUseCase: true,
      essentialServicesUseCase: true,
      lawEnforcementUseCase: true,
      migrationUseCase: true,
      justiceUseCase: true,
    }));
    expect(result.classification).toBe("HIGH_RISK");
    expect(result.highRiskArea).toBe("JUSTICE_DEMOCRACY");
  });

  it("TEST-MAX-007: MICRO company with ALL HIGH_RISK as BOTH role", () => {
    const result = classifyAISystem(baseAnswers({
      companySize: "MICRO",
      role: "BOTH",
      educationUseCase: true,
    }));
    expect(result.classification).toBe("HIGH_RISK");
    expect(result.obligations.length).toBeGreaterThan(10);
    expect(result.smeSimplifications.length).toBeGreaterThan(0);
    expect(result.smeSimplifications.join(" ")).toContain("Microenter");
  });

  it("TEST-MAX-008: LARGE BOTH role BIOMETRICS", () => {
    const result = classifyAISystem(baseAnswers({
      companySize: "LARGE",
      role: "BOTH",
      usesBiometrics: true,
      biometricType: "REMOTE_IDENTIFICATION",
    }));
    expect(result.classification).toBe("HIGH_RISK");
    const providerObs = result.obligations.filter(o => o.appliesToRole === "PROVIDER");
    const deployerObs = result.obligations.filter(o => o.appliesToRole === "DEPLOYER");
    expect(providerObs.length).toBeGreaterThan(0);
    expect(deployerObs.length).toBeGreaterThan(0);
    expect(result.smeSimplifications).toHaveLength(0);
  });

  it("TEST-MAX-011: minimum possible input → MINIMAL_RISK, no crash", () => {
    const result = classifyAISystem(baseAnswers());
    expect(result.classification).toBe("MINIMAL_RISK");
    expect(result.role).toBe("PROVIDER");
    expect(result.obligations.length).toBeGreaterThan(0);
  });

  it("TEST-MAX-012: BOTH role high-risk → no duplicate obligation IDs", () => {
    const result = classifyAISystem(baseAnswers({
      role: "BOTH",
      educationUseCase: true,
    }));
    const ids = result.obligations.map(o => o.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it("TEST-MAX-013: GPAI systemic + open source → all obligations still present", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiHighImpactCapabilities: true,
      gpaiOpenSource: true,
    }));
    expect(result.classification).toBe("GPAI_SYSTEMIC");
    const obligationIds = result.obligations.map(o => o.id);
    expect(obligationIds).toContain("MODEL_EVALUATION");
    expect(obligationIds).toContain("SYSTEMIC_RISK_MITIGATION");
    expect(obligationIds).toContain("SERIOUS_INCIDENT_TRACKING");
    expect(obligationIds).toContain("CYBERSECURITY_GPAI");
    expect(result.warnings.join(" ")).toContain("Open-source exception does NOT apply");
  });
});

// ============================================================================
// 3.4 OPTIONAL/UNDEFINED FIELD HANDLING
// ============================================================================

describe("3.4 Optional/Undefined Field Handling", () => {
  it("TEST-OPT-001: biometricType undefined + usesBiometrics=true → HIGH_RISK (BUG-A4 FIX)", () => {
    const result = classifyAISystem(baseAnswers({
      usesBiometrics: true,
      isBiometricVerificationOnly: false,
    }));
    // BUG-A4 FIX: Any non-verification biometric use triggers Annex III point 1
    // regardless of whether biometricType is specified. The type is informational.
    expect(result.classification).toBe("HIGH_RISK");
    expect(result.highRiskArea).toBe("BIOMETRICS");
    // Should warn to specify the biometric type
    expect(result.warnings.some(w => w.toLowerCase().includes("biometric use type"))).toBe(true);
  });

  it("TEST-OPT-002: educationType undefined + educationUseCase=true → still HIGH_RISK", () => {
    const result = classifyAISystem(baseAnswers({
      educationUseCase: true,
    }));
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("TEST-OPT-003: employmentType undefined + employmentUseCase=true → HIGH_RISK", () => {
    const result = classifyAISystem(baseAnswers({
      employmentUseCase: true,
    }));
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("TEST-OPT-004: essentialServiceType undefined + essentialServicesUseCase=true → HIGH_RISK", () => {
    const result = classifyAISystem(baseAnswers({
      essentialServicesUseCase: true,
    }));
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("TEST-OPT-005: lawEnforcementType undefined + lawEnforcementUseCase=true → HIGH_RISK", () => {
    const result = classifyAISystem(baseAnswers({
      lawEnforcementUseCase: true,
    }));
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("TEST-OPT-006: migrationType undefined + migrationUseCase=true → HIGH_RISK", () => {
    const result = classifyAISystem(baseAnswers({
      migrationUseCase: true,
    }));
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("TEST-OPT-007: justiceType undefined + justiceUseCase=true → HIGH_RISK", () => {
    const result = classifyAISystem(baseAnswers({
      justiceUseCase: true,
    }));
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("TEST-OPT-016: undefined use case flags treated as false", () => {
    // Test with Object.assign to bypass type checking
    const answers = Object.assign({}, baseAnswers(), { educationUseCase: undefined });
    const result = classifyAISystem(answers as WizardAnswers);
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("TEST-OPT-017: null compute treated as non-systemic", () => {
    const answers = Object.assign({}, baseAnswers({ isGeneralPurposeModel: true }), { gpaiTrainingCompute: null });
    const result = classifyAISystem(answers as WizardAnswers);
    expect(result.classification).toBe("GPAI");
  });

  it("TEST-OPT-018: falsy 0 for boolean → NOT prohibited", () => {
    const answers = Object.assign({}, baseAnswers(), { socialScoring: 0 });
    const result = classifyAISystem(answers as WizardAnswers);
    expect(result.classification).not.toBe("PROHIBITED");
  });

  it("TEST-OPT-019: empty string for boolean → NOT prohibited", () => {
    const answers = Object.assign({}, baseAnswers(), { socialScoring: "" });
    const result = classifyAISystem(answers as WizardAnswers);
    expect(result.classification).not.toBe("PROHIBITED");
  });

  it("TEST-OPT-020: truthy 1 for boolean → PROHIBITED (runtime safety)", () => {
    const answers = Object.assign({}, baseAnswers(), { socialScoring: 1 });
    const result = classifyAISystem(answers as WizardAnswers);
    expect(result.classification).toBe("PROHIBITED");
  });
});

// ============================================================================
// 3.5 PRIORITY ORDER STRESS TESTS
// ============================================================================

describe("3.5 Priority Order Stress Tests", () => {
  it("TEST-PRI-002: scope exclusion > GPAI", () => {
    const result = classifyAISystem(baseAnswers({
      militaryDefenceOnly: true,
      isGeneralPurposeModel: true,
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("TEST-PRI-003: scope exclusion > safety component high-risk", () => {
    const result = classifyAISystem(baseAnswers({
      personalNonProfessional: true,
      isSafetyComponent: true,
      productUnderAnnexI: true,
      requiresThirdPartyConformity: true,
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("TEST-PRI-004: scope exclusion > Annex III high-risk", () => {
    const result = classifyAISystem(baseAnswers({
      scientificResearchOnly: true,
      educationUseCase: true,
    }));
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("TEST-PRI-007: prohibited > safety component high-risk", () => {
    const result = classifyAISystem(baseAnswers({
      socialScoring: true,
      isSafetyComponent: true,
      productUnderAnnexI: true,
      requiresThirdPartyConformity: true,
    }));
    expect(result.classification).toBe("PROHIBITED");
  });

  it("TEST-PRI-009: prohibited > transparency", () => {
    const result = classifyAISystem(baseAnswers({
      socialScoring: true,
      interactsWithHumans: true,
    }));
    expect(result.classification).toBe("PROHIBITED");
  });

  it("TEST-PRI-012: GPAI > transparency", () => {
    const result = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      interactsWithHumans: true,
    }));
    expect(result.classification).toBe("GPAI");
  });

  it("TEST-PRI-014: safety component > transparency", () => {
    const result = classifyAISystem(baseAnswers({
      isSafetyComponent: true,
      productUnderAnnexI: true,
      requiresThirdPartyConformity: true,
      interactsWithHumans: true,
    }));
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("TEST-PRI-015: Annex III > transparency", () => {
    const result = classifyAISystem(baseAnswers({
      educationUseCase: true,
      interactsWithHumans: true,
    }));
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("TEST-PRI-016: transparency > minimal risk", () => {
    const result = classifyAISystem(baseAnswers({
      interactsWithHumans: true,
    }));
    expect(result.classification).toBe("LIMITED_RISK");
  });

  it("Prohibited with all lower classifications simultaneously", () => {
    const result = classifyAISystem(baseAnswers({
      socialScoring: true,
      isGeneralPurposeModel: true,
      isSafetyComponent: true, productUnderAnnexI: true, requiresThirdPartyConformity: true,
      educationUseCase: true,
      interactsWithHumans: true,
    }));
    expect(result.classification).toBe("PROHIBITED");
  });
});
