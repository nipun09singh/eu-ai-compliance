/**
 * GAP 2: LEGAL VALIDATION AGAINST REGULATION TEXT
 *
 * Validates that every article reference, obligation description, fine amount,
 * deadline, and legal citation in the engine output exactly matches the EU AI Act
 * regulation text (Regulation (EU) 2024/1689).
 *
 * ~140 tests across 7 sections.
 */

import { describe, it, expect } from "vitest";
import {
  classifyAISystem,
  getEnforcementTimeline,
  TEMPLATE_REGISTRY,
  type WizardAnswers,
  type ClassificationResult,
} from "../classification-engine";

// ============================================================================
// HELPER
// ============================================================================

function baseAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return {
    companyName: "TestCo",
    companySize: "SMALL",
    isEUBased: true,
    outputUsedInEU: true,
    role: "PROVIDER",
    systemDescription: "A generic AI system for testing",
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
// 4.1 ARTICLE REFERENCE ACCURACY
// ============================================================================

describe("4.1 Article Reference Accuracy", () => {
  // ── 4.1.1 Prohibited Practice Article References ──────────────────────

  describe("4.1.1 Prohibited Practice Article References", () => {
    it("TEST-LAW-001: SUBLIMINAL_MANIPULATION → Article 5(1)(a)", () => {
      const r = classifyAISystem(baseAnswers({
        usesSubliminaManipulation: true,
        manipulationCausesSignificantHarm: true,
      }));
      expect(r.classification).toBe("PROHIBITED");
      expect(r.legalBasis).toContain("Article 5(1)(a)");
    });

    it("TEST-LAW-002: VULNERABILITY_EXPLOITATION → Article 5(1)(b)", () => {
      const r = classifyAISystem(baseAnswers({
        exploitsVulnerabilities: true,
        exploitationCausesSignificantHarm: true,
      }));
      expect(r.classification).toBe("PROHIBITED");
      expect(r.legalBasis).toContain("Article 5(1)(b)");
    });

    it("TEST-LAW-003: SOCIAL_SCORING → Article 5(1)(c)", () => {
      const r = classifyAISystem(baseAnswers({ socialScoring: true }));
      expect(r.classification).toBe("PROHIBITED");
      expect(r.legalBasis).toContain("Article 5(1)(c)");
    });

    it("TEST-LAW-004: CRIMINAL_RISK_PROFILING_SOLELY → Article 5(1)(d)", () => {
      const r = classifyAISystem(baseAnswers({
        criminalRiskProfiling: true,
        crimeProfilingBasedSolelyOnPersonality: true,
        crimeProfilingSupportingHumanAssessment: false,
      }));
      expect(r.classification).toBe("PROHIBITED");
      expect(r.legalBasis).toContain("Article 5(1)(d)");
    });

    it("TEST-LAW-005: UNTARGETED_FACIAL_SCRAPING → Article 5(1)(e)", () => {
      const r = classifyAISystem(baseAnswers({ facialRecognitionScraping: true }));
      expect(r.classification).toBe("PROHIBITED");
      expect(r.legalBasis).toContain("Article 5(1)(e)");
    });

    it("TEST-LAW-006: WORKPLACE_EMOTION_DETECTION → Article 5(1)(f)", () => {
      const r = classifyAISystem(baseAnswers({
        workplaceEmotionDetection: true,
        workplaceEmotionForMedicalSafety: false,
      }));
      expect(r.classification).toBe("PROHIBITED");
      expect(r.legalBasis).toContain("Article 5(1)(f)");
    });

    it("TEST-LAW-007: BIOMETRIC_CATEGORISATION_SENSITIVE → Article 5(1)(g)", () => {
      const r = classifyAISystem(baseAnswers({
        biometricCategorisationSensitive: true,
        biometricCatForLawEnforcementLabelling: false,
      }));
      expect(r.classification).toBe("PROHIBITED");
      expect(r.legalBasis).toContain("Article 5(1)(g)");
    });

    it("TEST-LAW-008: REALTIME_BIOMETRIC_LAW_ENFORCEMENT → Article 5(1)(h)", () => {
      const r = classifyAISystem(baseAnswers({
        realtimeBiometricPublicSpaces: true,
      }));
      expect(r.classification).toBe("PROHIBITED");
      expect(r.legalBasis).toContain("Article 5(1)(h)");
    });

    it("TEST-LAW-008b: Each prohibited practice → does NOT cite other articles", () => {
      const r = classifyAISystem(baseAnswers({
        usesSubliminaManipulation: true,
        manipulationCausesSignificantHarm: true,
      }));
      expect(r.legalBasis).toContain("Article 5(1)(a)");
      expect(r.legalBasis).not.toContain("Article 5(1)(b)");
      expect(r.legalBasis).not.toContain("Article 5(1)(c)");
    });
  });

  // ── 4.1.2 Annex III Point References ──────────────────────────────────

  describe("4.1.2 Annex III Point References", () => {
    it("TEST-LAW-009: BIOMETRICS → Annex III, point 1", () => {
      const r = classifyAISystem(baseAnswers({
        usesBiometrics: true,
        biometricType: "REMOTE_IDENTIFICATION",
        isBiometricVerificationOnly: false,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.legalBasis).toContain("Annex III, point 1");
    });

    it("TEST-LAW-010: CRITICAL_INFRASTRUCTURE → Annex III, point 2", () => {
      const r = classifyAISystem(baseAnswers({
        criticalInfrastructure: true,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.legalBasis).toContain("Annex III, point 2");
    });

    it("TEST-LAW-011: EDUCATION → Annex III, point 3", () => {
      const r = classifyAISystem(baseAnswers({
        educationUseCase: true,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.legalBasis).toContain("Annex III, point 3");
    });

    it("TEST-LAW-012: EMPLOYMENT → Annex III, point 4", () => {
      const r = classifyAISystem(baseAnswers({
        employmentUseCase: true,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.legalBasis).toContain("Annex III, point 4");
    });

    it("TEST-LAW-013: ESSENTIAL_SERVICES → Annex III, point 5", () => {
      const r = classifyAISystem(baseAnswers({
        essentialServicesUseCase: true,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.legalBasis).toContain("Annex III, point 5");
    });

    it("TEST-LAW-014: LAW_ENFORCEMENT → Annex III, point 6", () => {
      const r = classifyAISystem(baseAnswers({
        lawEnforcementUseCase: true,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.legalBasis).toContain("Annex III, point 6");
    });

    it("TEST-LAW-015: MIGRATION_ASYLUM_BORDER → Annex III, point 7", () => {
      const r = classifyAISystem(baseAnswers({
        migrationUseCase: true,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.legalBasis).toContain("Annex III, point 7");
    });

    it("TEST-LAW-016: JUSTICE_DEMOCRACY → Annex III, point 8", () => {
      const r = classifyAISystem(baseAnswers({
        justiceUseCase: true,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.legalBasis).toContain("Annex III, point 8");
    });

    it("TEST-LAW-017: HIGH_RISK via Annex III always includes Article 6(2)", () => {
      const r = classifyAISystem(baseAnswers({
        educationUseCase: true,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.legalBasis).toContain("Article 6(2)");
    });

    it("TEST-LAW-018: HIGH_RISK via safety component includes Article 6(1) AND Annex I", () => {
      const r = classifyAISystem(baseAnswers({
        isSafetyComponent: true,
        productUnderAnnexI: true,
        requiresThirdPartyConformity: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.legalBasis).toContain("Article 6(1)");
      expect(r.legalBasis).toContain("Annex I");
    });

    it("TEST-LAW-019: Art 6(3) exception includes Article 6(3) in legalBasis", () => {
      const r = classifyAISystem(baseAnswers({
        educationUseCase: true,
        posesSignificantRiskOfHarm: false,
        narrowProceduralTask: true,
      }));
      expect(r.classification).toBe("MINIMAL_RISK");
      expect(r.legalBasis).toContain("Article 6(3)");
    });
  });

  // ── 4.1.3 GPAI Article References ─────────────────────────────────────

  describe("4.1.3 GPAI Article References", () => {
    it("TEST-LAW-020: Standard GPAI → Article 53", () => {
      const r = classifyAISystem(baseAnswers({
        isGeneralPurposeModel: true,
      }));
      expect(r.classification).toBe("GPAI");
      expect(r.legalBasis).toContain("Article 53");
    });

    it("TEST-LAW-021: GPAI_SYSTEMIC → Article 51 AND Article 55", () => {
      const r = classifyAISystem(baseAnswers({
        isGeneralPurposeModel: true,
        gpaiHighImpactCapabilities: true,
      }));
      expect(r.classification).toBe("GPAI_SYSTEMIC");
      expect(r.legalBasis).toContain("Article 51");
      expect(r.legalBasis).toContain("Article 55");
    });

    it("TEST-LAW-022: GPAI base obligation articles are correct", () => {
      const r = classifyAISystem(baseAnswers({
        isGeneralPurposeModel: true,
      }));
      const techDoc = r.obligations.find(o => o.id === "GPAI_TECHNICAL_DOC");
      expect(techDoc).toBeDefined();
      expect(techDoc!.article).toContain("Article 53(1)(a)");
      expect(techDoc!.article).toContain("Annex XI");

      const downstream = r.obligations.find(o => o.id === "GPAI_DOWNSTREAM_INFO");
      expect(downstream).toBeDefined();
      expect(downstream!.article).toContain("Article 53(1)(b)");
      expect(downstream!.article).toContain("Annex XII");

      const copyright = r.obligations.find(o => o.id === "GPAI_COPYRIGHT_POLICY");
      expect(copyright).toBeDefined();
      expect(copyright!.article).toBe("Article 53(1)(c)");

      const training = r.obligations.find(o => o.id === "GPAI_TRAINING_SUMMARY");
      expect(training).toBeDefined();
      expect(training!.article).toBe("Article 53(1)(d)");
    });

    it("TEST-LAW-023: GPAI systemic obligation articles are correct", () => {
      const r = classifyAISystem(baseAnswers({
        isGeneralPurposeModel: true,
        gpaiHighImpactCapabilities: true,
      }));
      const evaluation = r.obligations.find(o => o.id === "MODEL_EVALUATION");
      expect(evaluation).toBeDefined();
      expect(evaluation!.article).toBe("Article 55(1)(a)");

      const mitigation = r.obligations.find(o => o.id === "SYSTEMIC_RISK_MITIGATION");
      expect(mitigation).toBeDefined();
      expect(mitigation!.article).toBe("Article 55(1)(b)");

      const incidents = r.obligations.find(o => o.id === "SERIOUS_INCIDENT_TRACKING");
      expect(incidents).toBeDefined();
      expect(incidents!.article).toBe("Article 55(1)(c)");

      const cyber = r.obligations.find(o => o.id === "CYBERSECURITY_GPAI");
      expect(cyber).toBeDefined();
      expect(cyber!.article).toBe("Article 55(1)(d)");
    });
  });

  // ── 4.1.4 Transparency Article References ─────────────────────────────

  describe("4.1.4 Transparency Article References", () => {
    it("TEST-LAW-024: HUMAN_INTERACTION → Article 50(1)", () => {
      const r = classifyAISystem(baseAnswers({ interactsWithHumans: true }));
      const o = r.obligations.find(o => o.id === "TRANSPARENCY_INTERACTION");
      expect(o).toBeDefined();
      expect(o!.article).toBe("Article 50(1)");
    });

    it("TEST-LAW-025: EMOTION_RECOGNITION → Article 50(3)", () => {
      const r = classifyAISystem(baseAnswers({ usesEmotionRecognition: true }));
      const o = r.obligations.find(o => o.id === "TRANSPARENCY_EMOTION");
      expect(o).toBeDefined();
      expect(o!.article).toBe("Article 50(3)");
    });

    it("TEST-LAW-026: BIOMETRIC_CATEGORISATION → Article 50(3)", () => {
      const r = classifyAISystem(baseAnswers({ usesBiometricCategorisation: true }));
      const o = r.obligations.find(o => o.id === "TRANSPARENCY_BIOMETRIC_CAT");
      expect(o).toBeDefined();
      expect(o!.article).toBe("Article 50(3)");
    });

    it("TEST-LAW-027: DEEPFAKE_CONTENT → Article 50(4)", () => {
      const r = classifyAISystem(baseAnswers({ generatesDeepfakes: true }));
      const o = r.obligations.find(o => o.id === "TRANSPARENCY_DEEPFAKE");
      expect(o).toBeDefined();
      expect(o!.article).toBe("Article 50(4)");
    });

    it("TEST-LAW-028: AI_GENERATED_TEXT → Article 50(4)", () => {
      const r = classifyAISystem(baseAnswers({ generatesText: true }));
      const o = r.obligations.find(o => o.id === "TRANSPARENCY_TEXT");
      expect(o).toBeDefined();
      expect(o!.article).toBe("Article 50(4)");
    });

    it("TEST-LAW-029: AI_GENERATED_MEDIA → Article 50(2)", () => {
      const r = classifyAISystem(baseAnswers({ generatesMedia: true }));
      const o = r.obligations.find(o => o.id === "TRANSPARENCY_MEDIA");
      expect(o).toBeDefined();
      expect(o!.article).toBe("Article 50(2)");
    });
  });

  // ── 4.1.5 High-Risk Provider Obligation Article References ────────────

  describe("4.1.5 Provider Obligation Article References", () => {
    const providerResult = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
      role: "PROVIDER",
    }));

    const obligationArticleMap: Record<string, string> = {
      RISK_MANAGEMENT_SYSTEM: "Article 9",
      DATA_GOVERNANCE: "Article 10",
      TECHNICAL_DOCUMENTATION: "Article 11, Annex IV",
      RECORD_KEEPING: "Article 12",
      TRANSPARENCY_TO_DEPLOYERS: "Article 13",
      HUMAN_OVERSIGHT: "Article 14",
      ACCURACY_ROBUSTNESS_CYBERSEC: "Article 15",
      QUALITY_MANAGEMENT_SYSTEM: "Article 17",
      DOCUMENTATION_KEEPING_10YR: "Article 18",
      AUTO_LOG_RETENTION: "Article 19",
      CORRECTIVE_ACTIONS: "Article 20",
      CONFORMITY_ASSESSMENT: "Article 43",
      EU_DECLARATION: "Article 47, Annex V",
      CE_MARKING: "Article 48",
      EU_DATABASE_REGISTRATION: "Article 49(1), Annex VIII Section A",
      POST_MARKET_MONITORING: "Article 72",
      SERIOUS_INCIDENT_REPORTING: "Article 73",
    };

    for (const [id, article] of Object.entries(obligationArticleMap)) {
      it(`TEST-LAW-030+: ${id} → ${article}`, () => {
        const obl = providerResult.obligations.find(o => o.id === id);
        expect(obl).toBeDefined();
        expect(obl!.article).toBe(article);
      });
    }
  });

  // ── 4.1.6 Deployer Obligation Article References ──────────────────────

  describe("4.1.6 Deployer Obligation Article References", () => {
    const deployerResult = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
      role: "DEPLOYER",
    }));

    const deployerObligationArticleMap: Record<string, string> = {
      DEPLOY_PER_INSTRUCTIONS: "Article 26(1)",
      ASSIGN_HUMAN_OVERSIGHT: "Article 26(2)",
      MONITOR_OPERATIONS: "Article 26(5)",
      KEEP_DEPLOYER_LOGS: "Article 26(6)",
      INFORM_WORKERS: "Article 26(7)",
      INFORM_AFFECTED_PERSONS: "Article 26(11)",
      DPIA_IF_APPLICABLE: "Article 26(9)",
      DEPLOYER_REGISTRATION: "Article 49(3)",
      FUNDAMENTAL_RIGHTS_IMPACT: "Article 27",
    };

    for (const [id, article] of Object.entries(deployerObligationArticleMap)) {
      it(`TEST-LAW-047+: ${id} → ${article}`, () => {
        const obl = deployerResult.obligations.find(o => o.id === id);
        expect(obl).toBeDefined();
        expect(obl!.article).toBe(article);
      });
    }
  });
});

// ============================================================================
// 4.2 FINE CALCULATION ACCURACY
// ============================================================================

describe("4.2 Fine Calculation Accuracy", () => {
  // ── Prohibited fines ──────────────────────────────────────────────────

  it("TEST-FIN-001: PROHIBITED + LARGE → €35M, 7%, Art 99(3)", () => {
    const r = classifyAISystem(baseAnswers({
      socialScoring: true,
      companySize: "LARGE",
    }));
    expect(r.fineRisk.maxAmountGeneral).toBe("€35,000,000");
    expect(r.fineRisk.maxPercentTurnover).toBe(7);
    expect(r.fineRisk.article).toBe("Article 99(3)");
  });

  it("TEST-FIN-002: PROHIBITED + SMALL → SME lower cap", () => {
    const r = classifyAISystem(baseAnswers({
      socialScoring: true,
      companySize: "SMALL",
    }));
    expect(r.fineRisk.maxAmountSME.toLowerCase()).toContain("lower");
  });

  it("TEST-FIN-003: PROHIBITED + MICRO → SME lower cap", () => {
    const r = classifyAISystem(baseAnswers({
      socialScoring: true,
      companySize: "MICRO",
    }));
    expect(r.fineRisk.maxAmountSME.toLowerCase()).toContain("lower");
  });

  it("TEST-FIN-004: PROHIBITED + MEDIUM → SME lower cap", () => {
    const r = classifyAISystem(baseAnswers({
      socialScoring: true,
      companySize: "MEDIUM",
    }));
    expect(r.fineRisk.maxAmountSME.toLowerCase()).toContain("lower");
  });

  // ── High-risk fines ───────────────────────────────────────────────────

  it("TEST-FIN-005: HIGH_RISK + LARGE → €15M, 3%, Art 99(4)", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
      companySize: "LARGE",
    }));
    expect(r.fineRisk.maxAmountGeneral).toBe("€15,000,000");
    expect(r.fineRisk.maxPercentTurnover).toBe(3);
    expect(r.fineRisk.article).toBe("Article 99(4)");
  });

  it("TEST-FIN-006: HIGH_RISK + SMALL → SME lower cap", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
      companySize: "SMALL",
    }));
    expect(r.fineRisk.maxAmountSME.toLowerCase()).toContain("lower");
  });

  it("TEST-FIN-007: HIGH_RISK + MICRO → SME lower cap", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
      companySize: "MICRO",
    }));
    expect(r.fineRisk.maxAmountSME.toLowerCase()).toContain("lower");
  });

  // ── GPAI fines (BUG-C3 fixed: no SME protection) ─────────────────────

  it("TEST-FIN-009: GPAI + LARGE → €15M, 3%, Art 101(1)", () => {
    const r = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      companySize: "LARGE",
    }));
    expect(r.fineRisk.maxAmountGeneral).toBe("€15,000,000");
    expect(r.fineRisk.maxPercentTurnover).toBe(3);
    expect(r.fineRisk.article).toBe("Article 101(1)");
  });

  it("TEST-FIN-010: GPAI + SMALL → no SME protection (HIGHER)", () => {
    const r = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      companySize: "SMALL",
    }));
    expect(r.fineRisk.maxAmountSME.toUpperCase()).toContain("HIGHER");
  });

  it("TEST-FIN-011: GPAI + MICRO → no SME protection (HIGHER)", () => {
    const r = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      companySize: "MICRO",
    }));
    expect(r.fineRisk.maxAmountSME.toUpperCase()).toContain("HIGHER");
  });

  // ── Other fine tiers ──────────────────────────────────────────────────

  it("TEST-FIN-013: MINIMAL_RISK → N/A fines", () => {
    const r = classifyAISystem(baseAnswers());
    expect(r.fineRisk.maxAmountGeneral).toBe("N/A");
    expect(r.fineRisk.maxPercentTurnover).toBe(0);
  });

  it("TEST-FIN-014: Scope-excluded → fine article = N/A", () => {
    const r = classifyAISystem(baseAnswers({ militaryDefenceOnly: true }));
    expect(r.fineRisk.article).toBe("N/A");
  });

  it("TEST-FIN-015: Art 6(3) exception → Art 99(4) fine tier", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: false,
      narrowProceduralTask: true,
    }));
    expect(r.classification).toBe("MINIMAL_RISK");
    expect(r.fineRisk.article).toBe("Article 99(4)");
    expect(r.fineRisk.maxPercentTurnover).toBe(3);
  });

  it("TEST-FIN-016: LIMITED_RISK → Art 99(4) fine tier (same as HIGH_RISK)", () => {
    const r = classifyAISystem(baseAnswers({ interactsWithHumans: true }));
    expect(r.classification).toBe("LIMITED_RISK");
    expect(r.fineRisk.article).toBe("Article 99(4)");
    expect(r.fineRisk.maxPercentTurnover).toBe(3);
  });

  it("TEST-FIN-017: MICRO + PROHIBITED → note contains turnover example", () => {
    const r = classifyAISystem(baseAnswers({
      socialScoring: true,
      companySize: "MICRO",
    }));
    expect(r.fineRisk.note).toBeDefined();
    expect(r.fineRisk.note!).toContain("turnover");
  });

  it("TEST-FIN-018: LARGE + PROHIBITED → note is undefined", () => {
    const r = classifyAISystem(baseAnswers({
      socialScoring: true,
      companySize: "LARGE",
    }));
    expect(r.fineRisk.note).toBeUndefined();
  });
});

// ============================================================================
// 4.3 ENFORCEMENT DEADLINE ACCURACY
// ============================================================================

describe("4.3 Enforcement Deadline Accuracy", () => {
  it("TEST-DL-001: PROHIBITED → 2025-02-02", () => {
    const r = classifyAISystem(baseAnswers({ socialScoring: true }));
    expect(r.enforcementDeadline).toBe("2025-02-02");
  });

  it("TEST-DL-002: HIGH_RISK via Annex III → 2026-08-02", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.enforcementDeadline).toBe("2026-08-02");
  });

  it("TEST-DL-003: HIGH_RISK via safety component → 2027-08-02", () => {
    const r = classifyAISystem(baseAnswers({
      isSafetyComponent: true,
      productUnderAnnexI: true,
      requiresThirdPartyConformity: true,
    }));
    expect(r.enforcementDeadline).toBe("2027-08-02");
  });

  it("TEST-DL-004: LIMITED_RISK → 2026-08-02", () => {
    const r = classifyAISystem(baseAnswers({ interactsWithHumans: true }));
    expect(r.enforcementDeadline).toBe("2026-08-02");
  });

  it("TEST-DL-005: GPAI → 2025-08-02", () => {
    const r = classifyAISystem(baseAnswers({ isGeneralPurposeModel: true }));
    expect(r.enforcementDeadline).toBe("2025-08-02");
  });

  it("TEST-DL-006: GPAI_SYSTEMIC → 2025-08-02", () => {
    const r = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiHighImpactCapabilities: true,
    }));
    expect(r.enforcementDeadline).toBe("2025-08-02");
  });

  it("TEST-DL-007: MINIMAL_RISK → 2026-08-02", () => {
    const r = classifyAISystem(baseAnswers());
    expect(r.enforcementDeadline).toBe("2026-08-02");
  });

  it("TEST-DL-008: Art 6(3) exception → 2026-08-02", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: false,
      narrowProceduralTask: true,
    }));
    expect(r.enforcementDeadline).toBe("2026-08-02");
  });

  it("TEST-DL-009: AI_LITERACY obligation deadline = 2025-02-02", () => {
    const r = classifyAISystem(baseAnswers());
    const lit = r.obligations.find(o => o.id === "AI_LITERACY");
    expect(lit).toBeDefined();
    expect(lit!.deadline).toBe("2025-02-02");
  });

  it("TEST-DL-010: Provider HIGH_RISK Annex III → all non-AI_LITERACY deadlines = 2026-08-02", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    for (const obl of r.obligations) {
      if (obl.id === "AI_LITERACY") {
        expect(obl.deadline).toBe("2025-02-02");
      } else {
        expect(obl.deadline).toBe("2026-08-02");
      }
    }
  });

  it("TEST-DL-011: Provider HIGH_RISK safety → non-AI_LITERACY deadlines = 2027-08-02", () => {
    const r = classifyAISystem(baseAnswers({
      isSafetyComponent: true,
      productUnderAnnexI: true,
      requiresThirdPartyConformity: true,
    }));
    for (const obl of r.obligations) {
      if (obl.id === "AI_LITERACY") {
        expect(obl.deadline).toBe("2025-02-02");
      } else {
        expect(obl.deadline).toBe("2027-08-02");
      }
    }
  });

  it("TEST-DL-012: GPAI obligations → non-AI_LITERACY deadlines = 2025-08-02", () => {
    const r = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
    }));
    for (const obl of r.obligations) {
      if (obl.id === "AI_LITERACY") {
        expect(obl.deadline).toBe("2025-02-02");
      } else {
        expect(obl.deadline).toBe("2025-08-02");
      }
    }
  });

  // ── Timeline milestones ───────────────────────────────────────────────

  it("TEST-DL-017: getEnforcementTimeline() has 6 milestones with exact dates", () => {
    const timeline = getEnforcementTimeline(new Date("2024-01-01"));
    expect(timeline).toHaveLength(6);
    const dates = timeline.map(m => m.dateString);
    expect(dates).toContain("2025-02-02");
    expect(dates).toContain("2025-05-02");
    expect(dates).toContain("2025-08-02");
    expect(dates).toContain("2026-08-02");
    expect(dates).toContain("2027-08-02");
    expect(dates).toContain("2030-08-02");
  });

  it("TEST-DL-018: Codes of practice milestone (2025-05-02) exists", () => {
    const timeline = getEnforcementTimeline();
    const codesPractice = timeline.find(m => m.dateString === "2025-05-02");
    expect(codesPractice).toBeDefined();
    expect(codesPractice!.label.toLowerCase()).toContain("codes of practice");
  });

  it("TEST-DL-019: 2030-08-02 milestone mentions public authorities", () => {
    const timeline = getEnforcementTimeline();
    const m2030 = timeline.find(m => m.dateString === "2030-08-02");
    expect(m2030).toBeDefined();
    expect(m2030!.label.toLowerCase()).toContain("public authorities");
  });

  it("TEST-DL-020: All 6 milestones in strict chronological order", () => {
    const timeline = getEnforcementTimeline();
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].date.getTime()).toBeGreaterThan(timeline[i - 1].date.getTime());
    }
  });
});

// ============================================================================
// 4.4 OBLIGATION COMPLETENESS VALIDATION
// ============================================================================

describe("4.4 Obligation Completeness Validation", () => {
  // ── Provider HIGH_RISK ────────────────────────────────────────────────

  it("TEST-OBL-001: Provider HIGH_RISK (Annex III) → 18 obligations", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
      role: "PROVIDER",
    }));
    expect(r.obligations).toHaveLength(18);
    const ids = r.obligations.map(o => o.id);
    const expectedIds = [
      "RISK_MANAGEMENT_SYSTEM", "DATA_GOVERNANCE", "TECHNICAL_DOCUMENTATION",
      "RECORD_KEEPING", "TRANSPARENCY_TO_DEPLOYERS", "HUMAN_OVERSIGHT",
      "ACCURACY_ROBUSTNESS_CYBERSEC", "QUALITY_MANAGEMENT_SYSTEM",
      "DOCUMENTATION_KEEPING_10YR", "AUTO_LOG_RETENTION", "CORRECTIVE_ACTIONS",
      "CONFORMITY_ASSESSMENT", "EU_DECLARATION", "CE_MARKING",
      "EU_DATABASE_REGISTRATION", "POST_MARKET_MONITORING",
      "SERIOUS_INCIDENT_REPORTING", "AI_LITERACY",
    ];
    for (const id of expectedIds) {
      expect(ids).toContain(id);
    }
  });

  it("TEST-OBL-002: Provider HIGH_RISK must NOT include deployer obligations", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
      role: "PROVIDER",
    }));
    const ids = r.obligations.map(o => o.id);
    expect(ids).not.toContain("DEPLOY_PER_INSTRUCTIONS");
    expect(ids).not.toContain("ASSIGN_HUMAN_OVERSIGHT");
    expect(ids).not.toContain("MONITOR_OPERATIONS");
    expect(ids).not.toContain("KEEP_DEPLOYER_LOGS");
  });

  it("TEST-OBL-003: Provider HIGH_RISK (safety component) → deadlines = 2027-08-02", () => {
    const r = classifyAISystem(baseAnswers({
      isSafetyComponent: true,
      productUnderAnnexI: true,
      requiresThirdPartyConformity: true,
      role: "PROVIDER",
    }));
    expect(r.obligations).toHaveLength(18);
    const nonLiteracy = r.obligations.filter(o => o.id !== "AI_LITERACY");
    for (const obl of nonLiteracy) {
      expect(obl.deadline).toBe("2027-08-02");
    }
  });

  // ── Deployer HIGH_RISK ────────────────────────────────────────────────

  it("TEST-OBL-004: Deployer HIGH_RISK (FRIA area) → 11 obligations", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
      role: "DEPLOYER",
    }));
    expect(r.obligations).toHaveLength(11);
    const ids = r.obligations.map(o => o.id);
    expect(ids).toContain("FUNDAMENTAL_RIGHTS_IMPACT");
    expect(ids).toContain("REPORT_RISKS_TO_PROVIDER");
  });

  it("TEST-OBL-006: Deployer HIGH_RISK (non-FRIA: CRITICAL_INFRASTRUCTURE) → 10 obligations, no FRIA", () => {
    const r = classifyAISystem(baseAnswers({
      criticalInfrastructure: true,
      posesSignificantRiskOfHarm: true,
      role: "DEPLOYER",
    }));
    const ids = r.obligations.map(o => o.id);
    expect(ids).not.toContain("FUNDAMENTAL_RIGHTS_IMPACT");
    expect(ids).toContain("REPORT_RISKS_TO_PROVIDER");
    expect(r.obligations).toHaveLength(10);
  });

  it("TEST-OBL-006b: Deployer (non-FRIA: BIOMETRICS) → no FRIA", () => {
    const r = classifyAISystem(baseAnswers({
      usesBiometrics: true,
      biometricType: "REMOTE_IDENTIFICATION",
      isBiometricVerificationOnly: false,
      posesSignificantRiskOfHarm: true,
      role: "DEPLOYER",
    }));
    const ids = r.obligations.map(o => o.id);
    expect(ids).not.toContain("FUNDAMENTAL_RIGHTS_IMPACT");
  });

  // ── GPAI Obligations ──────────────────────────────────────────────────

  it("TEST-OBL-008: Standard GPAI (non-open-source) → 5 obligations", () => {
    const r = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
    }));
    expect(r.obligations).toHaveLength(5);
    const ids = r.obligations.map(o => o.id);
    expect(ids).toContain("GPAI_TECHNICAL_DOC");
    expect(ids).toContain("GPAI_DOWNSTREAM_INFO");
    expect(ids).toContain("GPAI_COPYRIGHT_POLICY");
    expect(ids).toContain("GPAI_TRAINING_SUMMARY");
    expect(ids).toContain("AI_LITERACY");
  });

  it("TEST-OBL-009: Standard GPAI (open-source) → 3 obligations", () => {
    const r = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiOpenSource: true,
    }));
    expect(r.obligations).toHaveLength(3);
    const ids = r.obligations.map(o => o.id);
    expect(ids).toContain("GPAI_COPYRIGHT_POLICY");
    expect(ids).toContain("GPAI_TRAINING_SUMMARY");
    expect(ids).toContain("AI_LITERACY");
    expect(ids).not.toContain("GPAI_TECHNICAL_DOC");
    expect(ids).not.toContain("GPAI_DOWNSTREAM_INFO");
  });

  it("TEST-OBL-010: GPAI_SYSTEMIC (non-open-source) → 10 obligations", () => {
    const r = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiHighImpactCapabilities: true,
    }));
    expect(r.obligations).toHaveLength(10);
    const ids = r.obligations.map(o => o.id);
    expect(ids).toContain("GPAI_TECHNICAL_DOC");
    expect(ids).toContain("GPAI_DOWNSTREAM_INFO");
    expect(ids).toContain("GPAI_COPYRIGHT_POLICY");
    expect(ids).toContain("GPAI_TRAINING_SUMMARY");
    expect(ids).toContain("MODEL_EVALUATION");
    expect(ids).toContain("SYSTEMIC_RISK_MITIGATION");
    expect(ids).toContain("SERIOUS_INCIDENT_TRACKING");
    expect(ids).toContain("CYBERSECURITY_GPAI");
    expect(ids).toContain("CODES_OF_PRACTICE_ADHERENCE");
    expect(ids).toContain("AI_LITERACY");
  });

  it("TEST-OBL-011: GPAI_SYSTEMIC (open-source) → still all 10 obligations", () => {
    const r = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiHighImpactCapabilities: true,
      gpaiOpenSource: true,
    }));
    expect(r.obligations).toHaveLength(10);
    const ids = r.obligations.map(o => o.id);
    expect(ids).toContain("GPAI_TECHNICAL_DOC");
    expect(ids).toContain("GPAI_DOWNSTREAM_INFO");
  });

  // ── Transparency obligation mapping ───────────────────────────────────

  it("TEST-OBL-012: Each transparency trigger maps to correct obligation ID", () => {
    const triggers: Array<{ key: keyof WizardAnswers; obligationId: string }> = [
      { key: "interactsWithHumans", obligationId: "TRANSPARENCY_INTERACTION" },
      { key: "usesEmotionRecognition", obligationId: "TRANSPARENCY_EMOTION" },
      { key: "usesBiometricCategorisation", obligationId: "TRANSPARENCY_BIOMETRIC_CAT" },
      { key: "generatesDeepfakes", obligationId: "TRANSPARENCY_DEEPFAKE" },
      { key: "generatesText", obligationId: "TRANSPARENCY_TEXT" },
      { key: "generatesMedia", obligationId: "TRANSPARENCY_MEDIA" },
    ];
    for (const { key, obligationId } of triggers) {
      const r = classifyAISystem(baseAnswers({ [key]: true }));
      const obl = r.obligations.find(o => o.id === obligationId);
      expect(obl).toBeDefined();
    }
  });

  it("TEST-OBL-013: Transparency obligation appliesToRole is correct", () => {
    const roleMap: Record<string, string> = {
      TRANSPARENCY_INTERACTION: "PROVIDER",
      TRANSPARENCY_EMOTION: "DEPLOYER",
      TRANSPARENCY_BIOMETRIC_CAT: "DEPLOYER",
      TRANSPARENCY_DEEPFAKE: "DEPLOYER",
      TRANSPARENCY_TEXT: "BOTH",
      TRANSPARENCY_MEDIA: "PROVIDER",
    };
    const r = classifyAISystem(baseAnswers({
      interactsWithHumans: true,
      usesEmotionRecognition: true,
      usesBiometricCategorisation: true,
      generatesDeepfakes: true,
      generatesText: true,
      generatesMedia: true,
    }));
    for (const [id, role] of Object.entries(roleMap)) {
      const obl = r.obligations.find(o => o.id === id);
      expect(obl).toBeDefined();
      expect(obl!.appliesToRole).toBe(role);
    }
  });

  it("TEST-OBL-014: TRANSPARENCY_DEEPFAKE priority = CRITICAL, others = HIGH", () => {
    const r = classifyAISystem(baseAnswers({
      interactsWithHumans: true,
      usesEmotionRecognition: true,
      usesBiometricCategorisation: true,
      generatesDeepfakes: true,
      generatesText: true,
      generatesMedia: true,
    }));
    const deepfake = r.obligations.find(o => o.id === "TRANSPARENCY_DEEPFAKE");
    expect(deepfake!.priority).toBe("CRITICAL");

    const others = r.obligations.filter(
      o => o.id.startsWith("TRANSPARENCY_") && o.id !== "TRANSPARENCY_DEEPFAKE"
    );
    for (const o of others) {
      expect(o.priority).toBe("HIGH");
    }
  });

  // ── Art 6(3) exception obligations ────────────────────────────────────

  it("TEST-OBL-015: Art 6(3) exception → 3 obligations", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: false,
      narrowProceduralTask: true,
    }));
    expect(r.classification).toBe("MINIMAL_RISK");
    expect(r.obligations).toHaveLength(3);
    const ids = r.obligations.map(o => o.id);
    expect(ids).toContain("DOCUMENT_NON_HIGH_RISK");
    expect(ids).toContain("REGISTER_NON_HIGH_RISK");
    expect(ids).toContain("AI_LITERACY");
  });

  it("TEST-OBL-016: DOCUMENT_NON_HIGH_RISK → Art 6(4), correct templateId", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: false,
      narrowProceduralTask: true,
    }));
    const doc = r.obligations.find(o => o.id === "DOCUMENT_NON_HIGH_RISK");
    expect(doc).toBeDefined();
    expect(doc!.article).toBe("Article 6(4)");
    expect(doc!.templateId).toBe("TMPL_NON_HIGH_RISK_ASSESSMENT");
  });

  it("TEST-OBL-017: REGISTER_NON_HIGH_RISK → Art 49(2), mentions Annex VIII", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: false,
      narrowProceduralTask: true,
    }));
    const reg = r.obligations.find(o => o.id === "REGISTER_NON_HIGH_RISK");
    expect(reg).toBeDefined();
    expect(reg!.article).toContain("Article 49(2)");
    expect(reg!.description).toContain("Annex VIII");
  });

  // ── Universal AI Literacy ─────────────────────────────────────────────

  it("TEST-OBL-018: AI_LITERACY appears in EVERY classification type", () => {
    const scenarios: Array<{ label: string; overrides: Partial<WizardAnswers> }> = [
      { label: "MINIMAL_RISK", overrides: {} },
      { label: "PROHIBITED", overrides: { socialScoring: true } },
      { label: "HIGH_RISK (Annex III)", overrides: { educationUseCase: true, posesSignificantRiskOfHarm: true } },
      { label: "HIGH_RISK (safety)", overrides: { isSafetyComponent: true, productUnderAnnexI: true, requiresThirdPartyConformity: true } },
      { label: "LIMITED_RISK", overrides: { interactsWithHumans: true } },
      { label: "GPAI", overrides: { isGeneralPurposeModel: true } },
      { label: "GPAI_SYSTEMIC", overrides: { isGeneralPurposeModel: true, gpaiHighImpactCapabilities: true } },
      { label: "MINIMAL_RISK (scope excluded)", overrides: { militaryDefenceOnly: true } },
      { label: "MINIMAL_RISK (Art 6(3))", overrides: { educationUseCase: true, posesSignificantRiskOfHarm: false, narrowProceduralTask: true } },
    ];
    for (const { label, overrides } of scenarios) {
      const r = classifyAISystem(baseAnswers(overrides));
      const lit = r.obligations.find(o => o.id === "AI_LITERACY");
      expect(lit).toBeDefined();
    }
  });

  it("TEST-OBL-019: AI_LITERACY details are correct", () => {
    const r = classifyAISystem(baseAnswers());
    const lit = r.obligations.find(o => o.id === "AI_LITERACY")!;
    expect(lit.article).toBe("Article 4");
    expect(lit.appliesToRole).toBe("BOTH");
    expect(lit.priority).toBe("MEDIUM");
    expect(lit.deadline).toBe("2025-02-02");
    expect(lit.description).toContain("staff");
    expect(lit.description).toContain("operation and use");
  });
});

// ============================================================================
// 4.5 ANNEX III SUB-TYPE LEGAL ACCURACY
// ============================================================================

describe("4.5 Annex III Sub-Type Legal Accuracy", () => {
  it("TEST-AX3-001: ESSENTIAL_SERVICES area recognised for PUBLIC_BENEFITS", () => {
    const r = classifyAISystem(baseAnswers({
      essentialServicesUseCase: true,
      essentialServiceType: "PUBLIC_BENEFITS",
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
    expect(r.highRiskArea).toBe("ESSENTIAL_SERVICES");
  });

  it("TEST-AX3-002: ESSENTIAL_SERVICES warnings mention fraud detection exception", () => {
    const r = classifyAISystem(baseAnswers({
      essentialServicesUseCase: true,
      essentialServiceType: "CREDITWORTHINESS",
      posesSignificantRiskOfHarm: true,
    }));
    const hasFraudWarning = r.warnings.some(w => w.toLowerCase().includes("fraud detection"));
    expect(hasFraudWarning).toBe(true);
  });

  it("TEST-AX3-005: BIOMETRICS with REMOTE_IDENTIFICATION → highRiskArea BIOMETRICS", () => {
    const r = classifyAISystem(baseAnswers({
      usesBiometrics: true,
      biometricType: "REMOTE_IDENTIFICATION",
      isBiometricVerificationOnly: false,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.highRiskArea).toBe("BIOMETRICS");
  });

  it("TEST-AX3-009: LAW_ENFORCEMENT → warnings contain 'permitted under' qualifier", () => {
    const r = classifyAISystem(baseAnswers({
      lawEnforcementUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    const hasPermittedWarning = r.warnings.some(w => w.includes("permitted under"));
    expect(hasPermittedWarning).toBe(true);
  });

  it("TEST-AX3-010: MIGRATION → warnings contain 'permitted under' qualifier", () => {
    const r = classifyAISystem(baseAnswers({
      migrationUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    const hasPermittedWarning = r.warnings.some(w => w.includes("permitted under"));
    expect(hasPermittedWarning).toBe(true);
  });

  it("TEST-AX3-011: BIOMETRICS → warnings contain 'permitted under' qualifier", () => {
    const r = classifyAISystem(baseAnswers({
      usesBiometrics: true,
      biometricType: "REMOTE_IDENTIFICATION",
      isBiometricVerificationOnly: false,
      posesSignificantRiskOfHarm: true,
    }));
    const hasPermittedWarning = r.warnings.some(w => w.includes("permitted under"));
    expect(hasPermittedWarning).toBe(true);
  });

  it("TEST-AX3-014: BIOMETRICS conformity assessment mentions 'notified body'", () => {
    const r = classifyAISystem(baseAnswers({
      usesBiometrics: true,
      biometricType: "REMOTE_IDENTIFICATION",
      isBiometricVerificationOnly: false,
      posesSignificantRiskOfHarm: true,
      role: "PROVIDER",
    }));
    const ca = r.obligations.find(o => o.id === "CONFORMITY_ASSESSMENT");
    expect(ca).toBeDefined();
    expect(ca!.description.toLowerCase()).toContain("notified body");
  });

  it("TEST-AX3-018a: EDUCATION conformity → Internal control (Annex VI)", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
      role: "PROVIDER",
    }));
    const ca = r.obligations.find(o => o.id === "CONFORMITY_ASSESSMENT");
    expect(ca).toBeDefined();
    expect(ca!.description).toContain("Internal control");
    expect(ca!.description).toContain("Annex VI");
  });

  it("TEST-AX3-018b: EMPLOYMENT conformity → Internal control (Annex VI)", () => {
    const r = classifyAISystem(baseAnswers({
      employmentUseCase: true,
      posesSignificantRiskOfHarm: true,
      role: "PROVIDER",
    }));
    const ca = r.obligations.find(o => o.id === "CONFORMITY_ASSESSMENT");
    expect(ca!.description).toContain("Internal control");
  });

  it("TEST-AX3-018c: ESSENTIAL_SERVICES conformity → Internal control", () => {
    const r = classifyAISystem(baseAnswers({
      essentialServicesUseCase: true,
      posesSignificantRiskOfHarm: true,
      role: "PROVIDER",
    }));
    const ca = r.obligations.find(o => o.id === "CONFORMITY_ASSESSMENT");
    expect(ca!.description).toContain("Internal control");
  });

  it("TEST-AX3-018d: LAW_ENFORCEMENT conformity → Internal control", () => {
    const r = classifyAISystem(baseAnswers({
      lawEnforcementUseCase: true,
      posesSignificantRiskOfHarm: true,
      role: "PROVIDER",
    }));
    const ca = r.obligations.find(o => o.id === "CONFORMITY_ASSESSMENT");
    expect(ca!.description).toContain("Internal control");
  });

  it("TEST-AX3-018e: MIGRATION conformity → Internal control", () => {
    const r = classifyAISystem(baseAnswers({
      migrationUseCase: true,
      posesSignificantRiskOfHarm: true,
      role: "PROVIDER",
    }));
    const ca = r.obligations.find(o => o.id === "CONFORMITY_ASSESSMENT");
    expect(ca!.description).toContain("Internal control");
  });

  it("TEST-AX3-018f: JUSTICE_DEMOCRACY conformity → Internal control", () => {
    const r = classifyAISystem(baseAnswers({
      justiceUseCase: true,
      posesSignificantRiskOfHarm: true,
      role: "PROVIDER",
    }));
    const ca = r.obligations.find(o => o.id === "CONFORMITY_ASSESSMENT");
    expect(ca!.description).toContain("Internal control");
  });

  it("TEST-AX3-018g: CRITICAL_INFRASTRUCTURE conformity → Internal control", () => {
    const r = classifyAISystem(baseAnswers({
      criticalInfrastructure: true,
      posesSignificantRiskOfHarm: true,
      role: "PROVIDER",
    }));
    const ca = r.obligations.find(o => o.id === "CONFORMITY_ASSESSMENT");
    expect(ca!.description).toContain("Internal control");
  });
});

// ============================================================================
// 4.6 WARNING TEXT ACCURACY
// ============================================================================

describe("4.6 Warning Text Accuracy", () => {
  it("TEST-WRN-005: Open-source scope exclusion → warning about limitations", () => {
    const r = classifyAISystem(baseAnswers({ openSourceNonHighRisk: true }));
    expect(r.classification).toBe("MINIMAL_RISK");
    const hasWarning = r.warnings.some(
      w => w.includes("Open-source") && w.includes("NOT apply")
    );
    expect(hasWarning).toBe(true);
  });

  it("TEST-WRN-006: Art 5(1)(a) grey area → warning with 'reasonably likely'", () => {
    const r = classifyAISystem(baseAnswers({
      usesSubliminaManipulation: true,
      manipulationCausesSignificantHarm: false,
    }));
    expect(r.classification).not.toBe("PROHIBITED");
    const hasGreyAreaWarning = r.warnings.some(
      w => w.includes("5(1)(a)") && w.includes("reasonably likely")
    );
    expect(hasGreyAreaWarning).toBe(true);
  });

  it("TEST-WRN-007: Art 5(1)(b) grey area → warning with harm standard", () => {
    const r = classifyAISystem(baseAnswers({
      exploitsVulnerabilities: true,
      exploitationCausesSignificantHarm: false,
    }));
    expect(r.classification).not.toBe("PROHIBITED");
    const hasGreyAreaWarning = r.warnings.some(
      w => w.includes("5(1)(b)") && w.includes("reasonably likely")
    );
    expect(hasGreyAreaWarning).toBe(true);
  });

  it("TEST-WRN-008: Art 5(1)(d) exception → warning about supporting human assessment", () => {
    const r = classifyAISystem(baseAnswers({
      criminalRiskProfiling: true,
      crimeProfilingBasedSolelyOnPersonality: false,
      crimeProfilingSupportingHumanAssessment: true,
    }));
    expect(r.classification).not.toBe("PROHIBITED");
    const hasExceptionWarning = r.warnings.some(
      w => w.includes("5(1)(d)") && w.includes("human assessment")
    );
    expect(hasExceptionWarning).toBe(true);
  });

  it("TEST-WRN-009: Art 5(1)(f) medical/safety exception → warning", () => {
    const r = classifyAISystem(baseAnswers({
      workplaceEmotionDetection: true,
      workplaceEmotionForMedicalSafety: true,
    }));
    expect(r.classification).not.toBe("PROHIBITED");
    const hasExceptionWarning = r.warnings.some(
      w => w.includes("5(1)(f)") && w.includes("medical") && w.includes("safety")
    );
    expect(hasExceptionWarning).toBe(true);
  });

  it("TEST-WRN-010: Art 5(1)(g) LE labelling exception → warning about lawfully acquired", () => {
    const r = classifyAISystem(baseAnswers({
      biometricCategorisationSensitive: true,
      biometricCatForLawEnforcementLabelling: true,
    }));
    expect(r.classification).not.toBe("PROHIBITED");
    const hasExceptionWarning = r.warnings.some(
      w => w.includes("5(1)(g)") && w.includes("lawfully acquired")
    );
    expect(hasExceptionWarning).toBe(true);
  });

  it("TEST-WRN-011: Art 5(1)(h) missing judicial auth → warning about authorization", () => {
    const r = classifyAISystem(baseAnswers({
      realtimeBiometricPublicSpaces: true,
      realtimeBiometricForLEException: true,
      realtimeBiometricHasJudicialAuth: false,
    }));
    expect(r.classification).toBe("PROHIBITED");
    const hasAuthWarning = r.warnings.some(
      w => w.includes("judicial") || w.includes("authorization") || w.includes("authorisation")
    );
    expect(hasAuthWarning).toBe(true);
  });

  it("TEST-WRN-012: Art 5(1)(h) full LE exception → warning about strict limitations", () => {
    const r = classifyAISystem(baseAnswers({
      realtimeBiometricPublicSpaces: true,
      realtimeBiometricForLEException: true,
      realtimeBiometricHasJudicialAuth: true,
    }));
    expect(r.classification).not.toBe("PROHIBITED");
    const hasStrictWarning = r.warnings.some(
      w => w.includes("victim") && w.includes("terrorist")
    );
    expect(hasStrictWarning).toBe(true);
  });

  it("TEST-WRN-013: Art 6(3) → warnings contain 'narrowly interpreted'", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: false,
      narrowProceduralTask: true,
    }));
    const hasNarrow = r.warnings.some(w => w.includes("narrowly interpreted"));
    expect(hasNarrow).toBe(true);
  });

  it("TEST-WRN-013b: Art 6(3) → nextSteps or warnings contain market surveillance mention", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: false,
      narrowProceduralTask: true,
    }));
    const allText = [...r.warnings, ...r.nextSteps].join(" ");
    const hasSurveillance = allText.includes("market surveillance") || allText.includes("Art 80");
    expect(hasSurveillance).toBe(true);
  });

  it("TEST-WRN-014: GPAI_SYSTEMIC with open-source → warning about no exemption", () => {
    const r = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiHighImpactCapabilities: true,
      gpaiOpenSource: true,
    }));
    expect(r.classification).toBe("GPAI_SYSTEMIC");
    const hasNoExemptionWarning = r.warnings.some(
      w => w.includes("does NOT apply")
    );
    expect(hasNoExemptionWarning).toBe(true);
  });

  it("TEST-WRN-015: Safety component HIGH_RISK → Annex I product categories warning", () => {
    const r = classifyAISystem(baseAnswers({
      isSafetyComponent: true,
      productUnderAnnexI: true,
      requiresThirdPartyConformity: true,
    }));
    const hasProductWarning = r.warnings.some(
      w => w.includes("machinery") && w.includes("medical devices")
    );
    expect(hasProductWarning).toBe(true);
  });

  it("TEST-WRN-016: EMPLOYMENT → GDPR DPIA warning", () => {
    const r = classifyAISystem(baseAnswers({
      employmentUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    const hasDPIA = r.warnings.some(
      w => w.includes("DPIA") || w.includes("Data Protection Impact Assessment")
    );
    expect(hasDPIA).toBe(true);
  });

  it("TEST-WRN-017: LAW_ENFORCEMENT → SECURE NON-PUBLIC section warning", () => {
    const r = classifyAISystem(baseAnswers({
      lawEnforcementUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    const hasSecure = r.warnings.some(
      w => w.toUpperCase().includes("SECURE NON-PUBLIC")
    );
    expect(hasSecure).toBe(true);
  });

  it("TEST-WRN-018: BIOMETRICS → verification exclusion warning", () => {
    const r = classifyAISystem(baseAnswers({
      usesBiometrics: true,
      biometricType: "REMOTE_IDENTIFICATION",
      isBiometricVerificationOnly: false,
      posesSignificantRiskOfHarm: true,
    }));
    const hasVerificationWarning = r.warnings.some(
      w => w.toLowerCase().includes("verification")
    );
    expect(hasVerificationWarning).toBe(true);
  });
});

// ============================================================================
// 4.7 TEMPLATE REGISTRY VALIDATION
// ============================================================================

describe("4.7 Template Registry Validation", () => {
  const validRiskClassifications = [
    "PROHIBITED", "HIGH_RISK", "LIMITED_RISK", "GPAI", "GPAI_SYSTEMIC", "MINIMAL_RISK",
  ];
  const validRoles = ["PROVIDER", "DEPLOYER", "BOTH", "IMPORTER", "DISTRIBUTOR", "AUTHORISED_REPRESENTATIVE"];

  it("TEST-TPL-035: TEMPLATE_REGISTRY has exactly 36 templates", () => {
    expect(Object.keys(TEMPLATE_REGISTRY)).toHaveLength(36);
  });

  it("TEST-TPL-001-036: All 36 templates have valid structure", () => {
    for (const [key, tmpl] of Object.entries(TEMPLATE_REGISTRY)) {
      expect(tmpl.name.length).toBeGreaterThan(0);
      expect(tmpl.description.length).toBeGreaterThan(0);
      expect(validRoles).toContain(tmpl.appliesToRole);
      expect(tmpl.requiredFor.length).toBeGreaterThan(0);
      for (const rc of tmpl.requiredFor) {
        expect(validRiskClassifications).toContain(rc);
      }
      expect(tmpl.articles.length).toBeGreaterThan(0);
      expect(tmpl.estimatedMinutes).toBeGreaterThan(0);
    }
  });

  it("TEST-TPL-026: TMPL_RISK_MANAGEMENT → HIGH_RISK, Article 9", () => {
    const t = TEMPLATE_REGISTRY["TMPL_RISK_MANAGEMENT"];
    expect(t).toBeDefined();
    expect(t.requiredFor).toContain("HIGH_RISK");
    expect(t.articles).toContain("Article 9");
  });

  it("TEST-TPL-027: TMPL_DATA_GOVERNANCE → HIGH_RISK, Article 10", () => {
    const t = TEMPLATE_REGISTRY["TMPL_DATA_GOVERNANCE"];
    expect(t.requiredFor).toContain("HIGH_RISK");
    expect(t.articles).toContain("Article 10");
  });

  it("TEST-TPL-028: TMPL_TECHNICAL_DOC → Article 11 AND Annex IV", () => {
    const t = TEMPLATE_REGISTRY["TMPL_TECHNICAL_DOC"];
    expect(t.articles).toContain("Article 11");
    expect(t.articles).toContain("Annex IV");
  });

  it("TEST-TPL-029: TMPL_NON_HIGH_RISK_ASSESSMENT → MINIMAL_RISK, Article 6(3) or 6(4)", () => {
    const t = TEMPLATE_REGISTRY["TMPL_NON_HIGH_RISK_ASSESSMENT"];
    expect(t.requiredFor).toContain("MINIMAL_RISK");
    const hasArt6 = t.articles.some(a => a.includes("Article 6(3)") || a.includes("Article 6(4)"));
    expect(hasArt6).toBe(true);
  });

  it("TEST-TPL-030: TMPL_EU_DB_REGISTRATION → both HIGH_RISK and MINIMAL_RISK", () => {
    const t = TEMPLATE_REGISTRY["TMPL_EU_DB_REGISTRATION"];
    expect(t.requiredFor).toContain("HIGH_RISK");
    expect(t.requiredFor).toContain("MINIMAL_RISK");
  });

  it("TEST-TPL-031: TMPL_GPAI_TECH_DOC → GPAI AND GPAI_SYSTEMIC", () => {
    const t = TEMPLATE_REGISTRY["TMPL_GPAI_TECH_DOC"];
    expect(t.requiredFor).toContain("GPAI");
    expect(t.requiredFor).toContain("GPAI_SYSTEMIC");
  });

  it("TEST-TPL-032: GPAI templates → appliesToRole = PROVIDER", () => {
    const gpaiTemplateIds = [
      "TMPL_GPAI_TECH_DOC", "TMPL_GPAI_DOWNSTREAM",
      "TMPL_COPYRIGHT_POLICY", "TMPL_TRAINING_SUMMARY",
    ];
    for (const id of gpaiTemplateIds) {
      const t = TEMPLATE_REGISTRY[id];
      expect(t).toBeDefined();
      expect(t.appliesToRole).toBe("PROVIDER");
    }
  });

  it("TEST-TPL-033: Transparency templates → correct roles", () => {
    const roleMap: Record<string, string> = {
      TMPL_AI_INTERACTION_NOTICE: "PROVIDER",
      TMPL_DEEPFAKE_DISCLOSURE: "DEPLOYER",
      TMPL_AI_TEXT_LABEL: "BOTH",
      TMPL_AI_MEDIA_MARKING: "PROVIDER",
      TMPL_EMOTION_NOTICE: "DEPLOYER",
      TMPL_BIOMETRIC_CAT_NOTICE: "DEPLOYER",
    };
    for (const [id, role] of Object.entries(roleMap)) {
      const t = TEMPLATE_REGISTRY[id];
      expect(t).toBeDefined();
      expect(t.appliesToRole).toBe(role);
    }
  });

  it("TEST-TPL-034: Every obligation templateId exists in TEMPLATE_REGISTRY", () => {
    const scenarios: Partial<WizardAnswers>[] = [
      {},
      { socialScoring: true },
      { educationUseCase: true, posesSignificantRiskOfHarm: true },
      { isSafetyComponent: true, productUnderAnnexI: true, requiresThirdPartyConformity: true },
      { interactsWithHumans: true, generatesDeepfakes: true, generatesMedia: true, generatesText: true, usesEmotionRecognition: true, usesBiometricCategorisation: true },
      { isGeneralPurposeModel: true },
      { isGeneralPurposeModel: true, gpaiHighImpactCapabilities: true },
      { educationUseCase: true, posesSignificantRiskOfHarm: false, narrowProceduralTask: true },
      { educationUseCase: true, posesSignificantRiskOfHarm: true, role: "DEPLOYER" as const },
      { educationUseCase: true, posesSignificantRiskOfHarm: true, role: "BOTH" as const },
    ];

    const allTemplateIds = new Set<string>();
    for (const overrides of scenarios) {
      const r = classifyAISystem(baseAnswers(overrides));
      for (const obl of r.obligations) {
        if (obl.templateId) {
          allTemplateIds.add(obl.templateId);
        }
      }
    }

    for (const templateId of allTemplateIds) {
      expect(TEMPLATE_REGISTRY[templateId]).toBeDefined();
    }
  });
});
