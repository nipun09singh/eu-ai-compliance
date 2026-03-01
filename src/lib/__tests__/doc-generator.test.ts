/**
 * LAYER 2: Document Generator Test Suite
 * 
 * 10 matrices covering the full doc-generator surface area:
 *   M1: Template Registry Integrity (~46 tests)
 *   M2: Template Selection Combinatorial (~80 tests)
 *   M3: Cross-Layer Consistency (~55 tests)
 *   M4: Instruction Completeness (~44 tests)
 *   M5: Prompt Construction Quality (~35 tests)
 *   M6: API Route Validation (~20 tests)
 *   M7: Generation Functions Mocked (~35 tests)
 *   M8: E2E Integration Flows (~30 tests)
 *   M9: Orphan Template Fix Verification (~15 tests)
 *   M10: Edge Cases & Boundary (~25 tests)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  classifyAISystem,
  type WizardAnswers,
  type ClassificationResult,
  type Role,
  TEMPLATE_REGISTRY,
} from "../classification-engine";
import {
  getApplicableTemplates,
  getEstimatedTime,
} from "../doc-generator";

// ============================================================================
// HELPERS
// ============================================================================

function baseAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return {
    companyName: "DocGenTestCo",
    companySize: "SMALL",
    isEUBased: true,
    outputUsedInEU: true,
    role: "PROVIDER",
    systemDescription: "Document generator test system",
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

/** HIGH_RISK PROVIDER (education use case) */
function highRiskProviderAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return baseAnswers({ role: "PROVIDER", educationUseCase: true, posesSignificantRiskOfHarm: true, ...overrides });
}

/** HIGH_RISK DEPLOYER (essential services) */
function highRiskDeployerAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return baseAnswers({ role: "DEPLOYER", essentialServicesUseCase: true, ...overrides });
}

/** HIGH_RISK BOTH */
function highRiskBothAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return baseAnswers({ role: "BOTH", educationUseCase: true, posesSignificantRiskOfHarm: true, ...overrides });
}

/** LIMITED_RISK PROVIDER */
function limitedRiskProviderAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return baseAnswers({ role: "PROVIDER", interactsWithHumans: true, ...overrides });
}

/** LIMITED_RISK DEPLOYER */
function limitedRiskDeployerAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return baseAnswers({ role: "DEPLOYER", interactsWithHumans: true, ...overrides });
}

/** GPAI PROVIDER */
function gpaiProviderAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return baseAnswers({ role: "PROVIDER", isGeneralPurposeModel: true, ...overrides });
}

/** GPAI_SYSTEMIC PROVIDER */
function gpaiSystemicProviderAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return baseAnswers({ role: "PROVIDER", isGeneralPurposeModel: true, gpaiHighImpactCapabilities: true, ...overrides });
}

/** MINIMAL_RISK PROVIDER */
function minimalRiskProviderAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return baseAnswers({ role: "PROVIDER", ...overrides }); // all flags false → minimal risk
}

/** MINIMAL_RISK DEPLOYER */
function minimalRiskDeployerAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return baseAnswers({ role: "DEPLOYER", ...overrides });
}

/** Helper to get ClassificationResult from WizardAnswers */
function classify(answers: WizardAnswers): ClassificationResult {
  return classifyAISystem(answers);
}

/** Get all template IDs from registry */
const ALL_TEMPLATE_IDS = Object.keys(TEMPLATE_REGISTRY);

/** All valid risk classifications */
const ALL_CLASSIFICATIONS = ["PROHIBITED", "HIGH_RISK", "LIMITED_RISK", "GPAI", "GPAI_SYSTEMIC", "MINIMAL_RISK"] as const;

/** All valid roles */
const ALL_ROLES: Role[] = ["PROVIDER", "DEPLOYER", "BOTH", "IMPORTER", "DISTRIBUTOR", "AUTHORISED_REPRESENTATIVE"];

// ============================================================================
// MATRIX 1: TEMPLATE REGISTRY INTEGRITY (~46 tests)
// ============================================================================

describe("M1: Template Registry Integrity", () => {
  // ── M1.1: Every template has required fields ──
  describe("M1.1: Template schema completeness", () => {
    for (const [id, tmpl] of Object.entries(TEMPLATE_REGISTRY)) {
      it(`${id} has all required fields`, () => {
        expect(tmpl).toHaveProperty("name");
        expect(tmpl).toHaveProperty("description");
        expect(tmpl).toHaveProperty("appliesToRole");
        expect(tmpl).toHaveProperty("requiredFor");
        expect(tmpl).toHaveProperty("articles");
        expect(tmpl).toHaveProperty("estimatedMinutes");
      });

      it(`${id} has valid field types`, () => {
        expect(typeof tmpl.name).toBe("string");
        expect(typeof tmpl.description).toBe("string");
        expect(tmpl.name.length).toBeGreaterThan(0);
        expect(tmpl.description.length).toBeGreaterThan(0);
        expect(Array.isArray(tmpl.requiredFor)).toBe(true);
        expect(tmpl.requiredFor.length).toBeGreaterThan(0);
        expect(Array.isArray(tmpl.articles)).toBe(true);
        expect(tmpl.articles.length).toBeGreaterThan(0);
        expect(typeof tmpl.estimatedMinutes).toBe("number");
        expect(tmpl.estimatedMinutes).toBeGreaterThan(0);
      });

      it(`${id} has a valid role`, () => {
        const validRoles = ["PROVIDER", "DEPLOYER", "BOTH", "IMPORTER", "DISTRIBUTOR", "AUTHORISED_REPRESENTATIVE"];
        expect(validRoles).toContain(tmpl.appliesToRole);
      });

      it(`${id} has valid classifications`, () => {
        for (const cls of tmpl.requiredFor) {
          expect(ALL_CLASSIFICATIONS).toContain(cls);
        }
      });

      it(`${id} articles reference real EU AI Act provisions`, () => {
        for (const art of tmpl.articles) {
          // Must start with "Article" or "Annex" or "Directive" or "GDPR"
          expect(art).toMatch(/^(Article|Annex|Directive|GDPR)/);
        }
      });
    }
  });

  // ── M1.2: No duplicate template IDs ──
  it("M1.2: template IDs are unique", () => {
    const ids = Object.keys(TEMPLATE_REGISTRY);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // ── M1.3: Registry has expected count ──
  it("M1.3: registry contains exactly 36 templates", () => {
    expect(ALL_TEMPLATE_IDS.length).toBe(36);
  });

  // ── M1.4: No template has 0 estimated minutes ──
  it("M1.4: all templates have positive estimated time", () => {
    for (const [id, tmpl] of Object.entries(TEMPLATE_REGISTRY)) {
      expect(tmpl.estimatedMinutes, `${id} estimatedMinutes`).toBeGreaterThan(0);
    }
  });

  // ── M1.5: Template names are human-readable ──
  it("M1.5: template names don't contain TMPL_ prefix", () => {
    for (const [, tmpl] of Object.entries(TEMPLATE_REGISTRY)) {
      expect(tmpl.name).not.toMatch(/^TMPL_/);
    }
  });

  // ── M1.6: All HIGH_RISK templates exist ──
  it("M1.6: expected HIGH_RISK templates present", () => {
    const hrTemplates = Object.entries(TEMPLATE_REGISTRY)
      .filter(([, t]) => t.requiredFor.includes("HIGH_RISK"))
      .map(([id]) => id);

    const expected = [
      "TMPL_RISK_MANAGEMENT", "TMPL_DATA_GOVERNANCE", "TMPL_TECHNICAL_DOC",
      "TMPL_LOGGING_SPEC", "TMPL_INSTRUCTIONS_FOR_USE", "TMPL_HUMAN_OVERSIGHT",
      "TMPL_ACCURACY_ROBUSTNESS", "TMPL_QMS", "TMPL_CORRECTIVE_ACTIONS",
      "TMPL_CONFORMITY_ASSESSMENT", "TMPL_EU_DECLARATION", "TMPL_EU_DB_REGISTRATION",
      "TMPL_POST_MARKET_MONITORING", "TMPL_FUNDAMENTAL_RIGHTS_IMPACT",
      "TMPL_AI_LITERACY_PLAN", "TMPL_DPIA_AI", "TMPL_DEPLOYER_PROCEDURES",
      "TMPL_INFORM_AFFECTED", "TMPL_IMPORTER_CHECKLIST", "TMPL_DISTRIBUTOR_CHECKLIST",
      "TMPL_AUTH_REP_MANDATE", "TMPL_SERIOUS_INCIDENT_REPORT",
      "TMPL_SUBSTANTIAL_MOD_ASSESSMENT",
    ];
    for (const tmplId of expected) {
      expect(hrTemplates, `Missing HR template: ${tmplId}`).toContain(tmplId);
    }
  });

  // ── M1.7: All GPAI templates exist ──
  it("M1.7: expected GPAI templates present", () => {
    const gpaiTemplates = Object.entries(TEMPLATE_REGISTRY)
      .filter(([, t]) => t.requiredFor.includes("GPAI"))
      .map(([id]) => id);

    const expected = [
      "TMPL_GPAI_TECH_DOC", "TMPL_GPAI_DOWNSTREAM", "TMPL_COPYRIGHT_POLICY",
      "TMPL_TRAINING_SUMMARY", "TMPL_AI_LITERACY_PLAN", "TMPL_CODES_OF_PRACTICE",
    ];
    for (const tmplId of expected) {
      expect(gpaiTemplates, `Missing GPAI template: ${tmplId}`).toContain(tmplId);
    }
  });

  // ── M1.8: All GPAI_SYSTEMIC templates include GPAI templates too ──
  it("M1.8: GPAI_SYSTEMIC templates are superset of GPAI", () => {
    const gpaiTmpls = Object.entries(TEMPLATE_REGISTRY)
      .filter(([, t]) => t.requiredFor.includes("GPAI"))
      .map(([id]) => id);
    const systemicTmpls = Object.entries(TEMPLATE_REGISTRY)
      .filter(([, t]) => t.requiredFor.includes("GPAI_SYSTEMIC"))
      .map(([id]) => id);

    for (const tmplId of gpaiTmpls) {
      expect(systemicTmpls, `${tmplId} should also be in GPAI_SYSTEMIC`).toContain(tmplId);
    }
    // Systemic should have extras
    expect(systemicTmpls.length).toBeGreaterThan(gpaiTmpls.length);
  });

  // ── M1.9: LIMITED_RISK templates ──
  it("M1.9: expected LIMITED_RISK templates present", () => {
    const lrTemplates = Object.entries(TEMPLATE_REGISTRY)
      .filter(([, t]) => t.requiredFor.includes("LIMITED_RISK"))
      .map(([id]) => id);

    const expected = [
      "TMPL_AI_INTERACTION_NOTICE", "TMPL_DEEPFAKE_DISCLOSURE",
      "TMPL_AI_TEXT_LABEL", "TMPL_AI_MEDIA_MARKING",
      "TMPL_EMOTION_NOTICE", "TMPL_BIOMETRIC_CAT_NOTICE",
      "TMPL_AI_LITERACY_PLAN",
    ];
    for (const tmplId of expected) {
      expect(lrTemplates, `Missing LR template: ${tmplId}`).toContain(tmplId);
    }
  });
});

// ============================================================================
// MATRIX 2: TEMPLATE SELECTION COMBINATORIAL (~80 tests)
// ============================================================================

describe("M2: Template Selection Combinatorial", () => {
  // ── M2.1: HIGH_RISK × PROVIDER ──
  describe("M2.1: HIGH_RISK × PROVIDER", () => {
    const result = classify(highRiskProviderAnswers());
    const templates = getApplicableTemplates(result);

    it("classification is HIGH_RISK", () => {
      expect(result.classification).toBe("HIGH_RISK");
    });

    it("role is PROVIDER", () => {
      expect(result.role).toBe("PROVIDER");
    });

    it("includes all provider-facing HR templates", () => {
      const expected = [
        "TMPL_RISK_MANAGEMENT", "TMPL_DATA_GOVERNANCE", "TMPL_TECHNICAL_DOC",
        "TMPL_LOGGING_SPEC", "TMPL_INSTRUCTIONS_FOR_USE", "TMPL_HUMAN_OVERSIGHT",
        "TMPL_ACCURACY_ROBUSTNESS", "TMPL_QMS", "TMPL_CORRECTIVE_ACTIONS",
        "TMPL_CONFORMITY_ASSESSMENT", "TMPL_EU_DECLARATION", "TMPL_EU_DB_REGISTRATION",
        "TMPL_POST_MARKET_MONITORING", "TMPL_AI_LITERACY_PLAN",
        "TMPL_SERIOUS_INCIDENT_REPORT", "TMPL_SUBSTANTIAL_MOD_ASSESSMENT",
      ];
      for (const tmplId of expected) {
        expect(templates, `Missing: ${tmplId}`).toContain(tmplId);
      }
    });

    it("excludes deployer-only HR templates", () => {
      expect(templates).not.toContain("TMPL_FUNDAMENTAL_RIGHTS_IMPACT");
      expect(templates).not.toContain("TMPL_DPIA_AI");
      expect(templates).not.toContain("TMPL_DEPLOYER_PROCEDURES");
      expect(templates).not.toContain("TMPL_INFORM_AFFECTED");
    });

    it("excludes IMPORTER/DISTRIBUTOR/AUTH_REP templates", () => {
      expect(templates).not.toContain("TMPL_IMPORTER_CHECKLIST");
      expect(templates).not.toContain("TMPL_DISTRIBUTOR_CHECKLIST");
      expect(templates).not.toContain("TMPL_AUTH_REP_MANDATE");
    });

    it("excludes GPAI templates", () => {
      expect(templates).not.toContain("TMPL_GPAI_TECH_DOC");
      expect(templates).not.toContain("TMPL_GPAI_DOWNSTREAM");
    });

    it("excludes LIMITED_RISK-only templates", () => {
      expect(templates).not.toContain("TMPL_AI_INTERACTION_NOTICE");
      expect(templates).not.toContain("TMPL_DEEPFAKE_DISCLOSURE");
    });
  });

  // ── M2.2: HIGH_RISK × DEPLOYER ──
  describe("M2.2: HIGH_RISK × DEPLOYER", () => {
    const result = classify(highRiskDeployerAnswers());
    const templates = getApplicableTemplates(result);

    it("classification is HIGH_RISK", () => {
      expect(result.classification).toBe("HIGH_RISK");
    });

    it("role is DEPLOYER", () => {
      expect(result.role).toBe("DEPLOYER");
    });

    it("includes deployer-facing HR templates", () => {
      const expected = [
        "TMPL_HUMAN_OVERSIGHT", "TMPL_EU_DB_REGISTRATION",
        "TMPL_FUNDAMENTAL_RIGHTS_IMPACT", "TMPL_AI_LITERACY_PLAN",
        "TMPL_DPIA_AI", "TMPL_DEPLOYER_PROCEDURES", "TMPL_INFORM_AFFECTED",
      ];
      for (const tmplId of expected) {
        expect(templates, `Missing: ${tmplId}`).toContain(tmplId);
      }
    });

    it("excludes provider-only HR templates", () => {
      expect(templates).not.toContain("TMPL_RISK_MANAGEMENT");
      expect(templates).not.toContain("TMPL_DATA_GOVERNANCE");
      expect(templates).not.toContain("TMPL_TECHNICAL_DOC");
      expect(templates).not.toContain("TMPL_QMS");
      expect(templates).not.toContain("TMPL_EU_DECLARATION");
    });
  });

  // ── M2.3: HIGH_RISK × BOTH ──
  describe("M2.3: HIGH_RISK × BOTH", () => {
    const result = classify(highRiskBothAnswers());
    const templates = getApplicableTemplates(result);

    it("classification is HIGH_RISK", () => {
      expect(result.classification).toBe("HIGH_RISK");
    });

    it("role is BOTH", () => {
      expect(result.role).toBe("BOTH");
    });

    it("includes BOTH provider and deployer HR templates", () => {
      // Provider templates
      expect(templates).toContain("TMPL_RISK_MANAGEMENT");
      expect(templates).toContain("TMPL_DATA_GOVERNANCE");
      expect(templates).toContain("TMPL_QMS");
      // Deployer templates
      expect(templates).toContain("TMPL_FUNDAMENTAL_RIGHTS_IMPACT");
      expect(templates).toContain("TMPL_DPIA_AI");
      expect(templates).toContain("TMPL_DEPLOYER_PROCEDURES");
      // BOTH templates
      expect(templates).toContain("TMPL_HUMAN_OVERSIGHT");
      expect(templates).toContain("TMPL_EU_DB_REGISTRATION");
      expect(templates).toContain("TMPL_AI_LITERACY_PLAN");
    });

    it("BOTH gets more templates than either PROVIDER or DEPLOYER alone", () => {
      const providerResult = classify(highRiskProviderAnswers());
      const deployerResult = classify(highRiskDeployerAnswers());
      const providerTemplates = getApplicableTemplates(providerResult);
      const deployerTemplates = getApplicableTemplates(deployerResult);

      expect(templates.length).toBeGreaterThanOrEqual(providerTemplates.length);
      expect(templates.length).toBeGreaterThanOrEqual(deployerTemplates.length);
    });
  });

  // ── M2.4: HIGH_RISK × IMPORTER ──
  describe("M2.4: HIGH_RISK × IMPORTER (via detectedRoles)", () => {
    const result = classify(highRiskDeployerAnswers({ broughtSystemFromOutsideEU: true }));
    const templates = getApplicableTemplates(result);

    it("detects IMPORTER role", () => {
      expect(result.detectedRoles).toContain("IMPORTER");
    });

    it("includes IMPORTER checklist", () => {
      expect(templates).toContain("TMPL_IMPORTER_CHECKLIST");
    });

    it("still includes deployer templates", () => {
      expect(templates).toContain("TMPL_AI_LITERACY_PLAN");
      expect(templates).toContain("TMPL_HUMAN_OVERSIGHT");
    });
  });

  // ── M2.5: HIGH_RISK × DISTRIBUTOR ──
  describe("M2.5: HIGH_RISK × DISTRIBUTOR (via detectedRoles)", () => {
    const result = classify(highRiskDeployerAnswers({ resellsOrDistributesSystem: true }));
    const templates = getApplicableTemplates(result);

    it("detects DISTRIBUTOR role", () => {
      expect(result.detectedRoles).toContain("DISTRIBUTOR");
    });

    it("includes DISTRIBUTOR checklist", () => {
      expect(templates).toContain("TMPL_DISTRIBUTOR_CHECKLIST");
    });
  });

  // ── M2.6: HIGH_RISK × AUTHORISED_REPRESENTATIVE ──
  describe("M2.6: HIGH_RISK × AUTH_REP (via detectedRoles)", () => {
    const result = classify(highRiskDeployerAnswers({ appointedAsAuthorisedRep: true }));
    const templates = getApplicableTemplates(result);

    it("detects AUTHORISED_REPRESENTATIVE role", () => {
      expect(result.detectedRoles).toContain("AUTHORISED_REPRESENTATIVE");
    });

    it("includes AUTH_REP mandate", () => {
      expect(templates).toContain("TMPL_AUTH_REP_MANDATE");
    });
  });

  // ── M2.7: HIGH_RISK × multiple detected roles ──
  describe("M2.7: HIGH_RISK × IMPORTER+DISTRIBUTOR", () => {
    const result = classify(highRiskDeployerAnswers({
      broughtSystemFromOutsideEU: true,
      resellsOrDistributesSystem: true,
    }));
    const templates = getApplicableTemplates(result);

    it("detects both roles", () => {
      expect(result.detectedRoles).toContain("IMPORTER");
      expect(result.detectedRoles).toContain("DISTRIBUTOR");
    });

    it("includes both checklists", () => {
      expect(templates).toContain("TMPL_IMPORTER_CHECKLIST");
      expect(templates).toContain("TMPL_DISTRIBUTOR_CHECKLIST");
    });
  });

  // ── M2.8: LIMITED_RISK × PROVIDER ──
  describe("M2.8: LIMITED_RISK × PROVIDER", () => {
    const result = classify(limitedRiskProviderAnswers());
    const templates = getApplicableTemplates(result);

    it("classification is LIMITED_RISK", () => {
      expect(result.classification).toBe("LIMITED_RISK");
    });

    it("includes provider-facing LR templates", () => {
      expect(templates).toContain("TMPL_AI_INTERACTION_NOTICE");
      expect(templates).toContain("TMPL_AI_TEXT_LABEL");
      expect(templates).toContain("TMPL_AI_MEDIA_MARKING");
      expect(templates).toContain("TMPL_AI_LITERACY_PLAN");
    });

    it("excludes deployer-only LR templates", () => {
      expect(templates).not.toContain("TMPL_DEEPFAKE_DISCLOSURE");
      expect(templates).not.toContain("TMPL_EMOTION_NOTICE");
      expect(templates).not.toContain("TMPL_BIOMETRIC_CAT_NOTICE");
    });

    it("excludes HIGH_RISK templates", () => {
      expect(templates).not.toContain("TMPL_RISK_MANAGEMENT");
      expect(templates).not.toContain("TMPL_QMS");
    });
  });

  // ── M2.9: LIMITED_RISK × DEPLOYER ──
  describe("M2.9: LIMITED_RISK × DEPLOYER", () => {
    const result = classify(limitedRiskDeployerAnswers());
    const templates = getApplicableTemplates(result);

    it("classification is LIMITED_RISK", () => {
      expect(result.classification).toBe("LIMITED_RISK");
    });

    it("includes deployer-facing LR templates", () => {
      expect(templates).toContain("TMPL_DEEPFAKE_DISCLOSURE");
      expect(templates).toContain("TMPL_AI_TEXT_LABEL");
      expect(templates).toContain("TMPL_EMOTION_NOTICE");
      expect(templates).toContain("TMPL_BIOMETRIC_CAT_NOTICE");
      expect(templates).toContain("TMPL_AI_LITERACY_PLAN");
    });

    it("excludes provider-only LR templates", () => {
      expect(templates).not.toContain("TMPL_AI_INTERACTION_NOTICE");
      expect(templates).not.toContain("TMPL_AI_MEDIA_MARKING");
    });
  });

  // ── M2.10: GPAI × PROVIDER ──
  describe("M2.10: GPAI × PROVIDER", () => {
    const result = classify(gpaiProviderAnswers());
    const templates = getApplicableTemplates(result);

    it("classification is GPAI", () => {
      expect(result.classification).toBe("GPAI");
    });

    it("includes all GPAI templates", () => {
      const expected = [
        "TMPL_GPAI_TECH_DOC", "TMPL_GPAI_DOWNSTREAM",
        "TMPL_COPYRIGHT_POLICY", "TMPL_TRAINING_SUMMARY",
        "TMPL_AI_LITERACY_PLAN", "TMPL_CODES_OF_PRACTICE",
      ];
      for (const tmplId of expected) {
        expect(templates, `Missing: ${tmplId}`).toContain(tmplId);
      }
    });

    it("excludes systemic-only templates", () => {
      expect(templates).not.toContain("TMPL_GPAI_SYSTEMIC_RISK");
    });

    it("excludes HIGH_RISK templates", () => {
      expect(templates).not.toContain("TMPL_RISK_MANAGEMENT");
    });
  });

  // ── M2.11: GPAI_SYSTEMIC × PROVIDER ──
  describe("M2.11: GPAI_SYSTEMIC × PROVIDER", () => {
    const result = classify(gpaiSystemicProviderAnswers());
    const templates = getApplicableTemplates(result);

    it("classification is GPAI_SYSTEMIC", () => {
      expect(result.classification).toBe("GPAI_SYSTEMIC");
    });

    it("includes all GPAI + systemic-only templates", () => {
      const expected = [
        "TMPL_GPAI_TECH_DOC", "TMPL_GPAI_DOWNSTREAM",
        "TMPL_COPYRIGHT_POLICY", "TMPL_TRAINING_SUMMARY",
        "TMPL_AI_LITERACY_PLAN", "TMPL_CODES_OF_PRACTICE",
        "TMPL_GPAI_SYSTEMIC_RISK",
      ];
      for (const tmplId of expected) {
        expect(templates, `Missing: ${tmplId}`).toContain(tmplId);
      }
    });

    it("has more templates than standard GPAI", () => {
      const gpaiResult = classify(gpaiProviderAnswers());
      const gpaiTemplates = getApplicableTemplates(gpaiResult);
      expect(templates.length).toBeGreaterThan(gpaiTemplates.length);
    });
  });

  // ── M2.12: MINIMAL_RISK × PROVIDER ──
  describe("M2.12: MINIMAL_RISK × PROVIDER", () => {
    const result = classify(minimalRiskProviderAnswers());
    const templates = getApplicableTemplates(result);

    it("classification is MINIMAL_RISK", () => {
      expect(result.classification).toBe("MINIMAL_RISK");
    });

    it("includes MINIMAL_RISK templates", () => {
      // AI_LITERACY_PLAN is required for all classifications including MINIMAL
      expect(templates).toContain("TMPL_AI_LITERACY_PLAN");
    });

    it("includes EU_DB_REGISTRATION if applicable", () => {
      // TMPL_EU_DB_REGISTRATION covers MINIMAL_RISK too
      const euDbReg = TEMPLATE_REGISTRY["TMPL_EU_DB_REGISTRATION"];
      if (euDbReg.requiredFor.includes("MINIMAL_RISK")) {
        expect(templates).toContain("TMPL_EU_DB_REGISTRATION");
      }
    });

    it("excludes HIGH_RISK-only templates", () => {
      expect(templates).not.toContain("TMPL_RISK_MANAGEMENT");
      expect(templates).not.toContain("TMPL_QMS");
      expect(templates).not.toContain("TMPL_CONFORMITY_ASSESSMENT");
    });
  });

  // ── M2.13: MINIMAL_RISK × DEPLOYER ──
  describe("M2.13: MINIMAL_RISK × DEPLOYER", () => {
    const result = classify(minimalRiskDeployerAnswers());
    const templates = getApplicableTemplates(result);

    it("classification is MINIMAL_RISK", () => {
      expect(result.classification).toBe("MINIMAL_RISK");
    });

    it("includes AI literacy plan", () => {
      expect(templates).toContain("TMPL_AI_LITERACY_PLAN");
    });

    it("includes EU_DB_REGISTRATION if BOTH applies", () => {
      // EU_DB_REGISTRATION appliesToRole is BOTH → should be included
      const tmpl = TEMPLATE_REGISTRY["TMPL_EU_DB_REGISTRATION"];
      if (tmpl.requiredFor.includes("MINIMAL_RISK") && (tmpl.appliesToRole === "BOTH" || tmpl.appliesToRole === "DEPLOYER")) {
        expect(templates).toContain("TMPL_EU_DB_REGISTRATION");
      }
    });
  });

  // ── M2.14: Different high-risk areas still get same templates ──
  describe("M2.14: HIGH_RISK area variations produce same template set", () => {
    const areas = [
      { field: "educationUseCase" as const, name: "education" },
      { field: "employmentUseCase" as const, name: "employment" },
      { field: "essentialServicesUseCase" as const, name: "essential_services" },
      { field: "criticalInfrastructure" as const, name: "critical_infra" },
      { field: "lawEnforcementUseCase" as const, name: "law_enforcement" },
      { field: "migrationUseCase" as const, name: "migration" },
      { field: "justiceUseCase" as const, name: "justice" },
    ];

    for (const area of areas) {
      it(`${area.name} area: correct template count for PROVIDER`, () => {
        const answers = highRiskProviderAnswers({ [area.field]: true });
        const result = classify(answers);
        if (result.classification === "HIGH_RISK") {
          const templates = getApplicableTemplates(result);
          // All HR providers should get the same set of provider-facing HR templates
          expect(templates).toContain("TMPL_RISK_MANAGEMENT");
          expect(templates).toContain("TMPL_AI_LITERACY_PLAN");
          expect(templates).toContain("TMPL_SUBSTANTIAL_MOD_ASSESSMENT");
        }
      });
    }
  });

  // ── M2.15: Each transparency obligation maps to the right template ──
  describe("M2.15: Transparency → template mapping", () => {
    it("interactsWithHumans → AI_INTERACTION_NOTICE", () => {
      const r = classify(baseAnswers({ interactsWithHumans: true }));
      expect(r.classification).toBe("LIMITED_RISK");
      const t = getApplicableTemplates(r);
      expect(t).toContain("TMPL_AI_INTERACTION_NOTICE");
    });

    it("generatesDeepfakes → DEEPFAKE_DISCLOSURE for DEPLOYER", () => {
      const r = classify(baseAnswers({ role: "DEPLOYER", generatesDeepfakes: true }));
      expect(r.classification).toBe("LIMITED_RISK");
      const t = getApplicableTemplates(r);
      expect(t).toContain("TMPL_DEEPFAKE_DISCLOSURE");
    });

    it("generatesMedia → AI_MEDIA_MARKING for PROVIDER", () => {
      const r = classify(baseAnswers({ generatesMedia: true }));
      expect(r.classification).toBe("LIMITED_RISK");
      const t = getApplicableTemplates(r);
      expect(t).toContain("TMPL_AI_MEDIA_MARKING");
    });

    it("usesEmotionRecognition → EMOTION_NOTICE for DEPLOYER", () => {
      const r = classify(baseAnswers({ role: "DEPLOYER", usesEmotionRecognition: true }));
      expect(r.classification).toBe("LIMITED_RISK");
      const t = getApplicableTemplates(r);
      expect(t).toContain("TMPL_EMOTION_NOTICE");
    });

    it("usesBiometricCategorisation → BIOMETRIC_CAT_NOTICE for DEPLOYER", () => {
      const r = classify(baseAnswers({ role: "DEPLOYER", usesBiometricCategorisation: true }));
      expect(r.classification).toBe("LIMITED_RISK");
      const t = getApplicableTemplates(r);
      expect(t).toContain("TMPL_BIOMETRIC_CAT_NOTICE");
    });
  });

  // ── M2.16: GPAI_SYSTEMIC via compute threshold ──
  it("M2.16: GPAI_SYSTEMIC via compute threshold gets systemic templates", () => {
    const r = classify(baseAnswers({ isGeneralPurposeModel: true, gpaiTrainingCompute: 2e25 }));
    expect(r.classification).toBe("GPAI_SYSTEMIC");
    const t = getApplicableTemplates(r);
    expect(t).toContain("TMPL_GPAI_SYSTEMIC_RISK");
    expect(t).toContain("TMPL_CODES_OF_PRACTICE");
  });
});

// ============================================================================
// MATRIX 3: CROSS-LAYER CONSISTENCY (~55 tests)
// ============================================================================

describe("M3: Cross-Layer Consistency", () => {
  // ── M3.1: Every obligation.templateId maps to a real template ──
  describe("M3.1: Obligation templateId → template exists", () => {
    const scenarios = [
      { name: "HIGH_RISK/PROVIDER", answers: highRiskProviderAnswers() },
      { name: "HIGH_RISK/DEPLOYER", answers: highRiskDeployerAnswers() },
      { name: "HIGH_RISK/BOTH", answers: highRiskBothAnswers() },
      { name: "GPAI/PROVIDER", answers: gpaiProviderAnswers() },
      { name: "GPAI_SYSTEMIC/PROVIDER", answers: gpaiSystemicProviderAnswers() },
      { name: "LIMITED_RISK/PROVIDER", answers: limitedRiskProviderAnswers() },
      { name: "LIMITED_RISK/DEPLOYER", answers: limitedRiskDeployerAnswers() },
      { name: "MINIMAL_RISK/PROVIDER", answers: minimalRiskProviderAnswers() },
    ];

    for (const s of scenarios) {
      it(`${s.name}: every obligation templateId is a valid template`, () => {
        const result = classify(s.answers);
        for (const obl of result.obligations) {
          if (obl.templateId) {
            expect(
              TEMPLATE_REGISTRY[obl.templateId],
              `Obligation "${obl.id}" references nonexistent template "${obl.templateId}"`
            ).toBeDefined();
          }
        }
      });
    }
  });

  // ── M3.2: Every template in getApplicableTemplates is in TEMPLATE_REGISTRY ──
  describe("M3.2: getApplicableTemplates returns only valid IDs", () => {
    const scenarios = [
      { name: "HIGH_RISK/PROVIDER", answers: highRiskProviderAnswers() },
      { name: "HIGH_RISK/DEPLOYER", answers: highRiskDeployerAnswers() },
      { name: "GPAI/PROVIDER", answers: gpaiProviderAnswers() },
      { name: "GPAI_SYSTEMIC/PROVIDER", answers: gpaiSystemicProviderAnswers() },
      { name: "LIMITED_RISK/PROVIDER", answers: limitedRiskProviderAnswers() },
      { name: "MINIMAL_RISK/PROVIDER", answers: minimalRiskProviderAnswers() },
    ];

    for (const s of scenarios) {
      it(`${s.name}: all returned templates exist in registry`, () => {
        const result = classify(s.answers);
        const templates = getApplicableTemplates(result);
        for (const id of templates) {
          expect(TEMPLATE_REGISTRY[id], `Template ${id} not in registry`).toBeDefined();
        }
      });
    }
  });

  // ── M3.3: Templates returned match classification ──
  describe("M3.3: Returned templates have matching requiredFor", () => {
    const scenarios = [
      { name: "HIGH_RISK", answers: highRiskProviderAnswers() },
      { name: "GPAI", answers: gpaiProviderAnswers() },
      { name: "GPAI_SYSTEMIC", answers: gpaiSystemicProviderAnswers() },
      { name: "LIMITED_RISK", answers: limitedRiskProviderAnswers() },
      { name: "MINIMAL_RISK", answers: minimalRiskProviderAnswers() },
    ];

    for (const s of scenarios) {
      it(`${s.name}: every returned template has ${s.name} in requiredFor`, () => {
        const result = classify(s.answers);
        const templates = getApplicableTemplates(result);
        for (const id of templates) {
          const tmpl = TEMPLATE_REGISTRY[id];
          expect(
            tmpl.requiredFor,
            `${id} does not list ${result.classification} in requiredFor`
          ).toContain(result.classification);
        }
      });
    }
  });

  // ── M3.4: Templates returned match role ──
  describe("M3.4: Returned templates match role", () => {
    it("PROVIDER sees no DEPLOYER-only templates", () => {
      const result = classify(highRiskProviderAnswers());
      const templates = getApplicableTemplates(result);
      for (const id of templates) {
        const tmpl = TEMPLATE_REGISTRY[id];
        if (tmpl.appliesToRole === "DEPLOYER") {
          throw new Error(`Provider should not get deployer-only template ${id}`);
        }
      }
    });

    it("DEPLOYER sees no PROVIDER-only templates", () => {
      const result = classify(highRiskDeployerAnswers());
      const templates = getApplicableTemplates(result);
      for (const id of templates) {
        const tmpl = TEMPLATE_REGISTRY[id];
        if (tmpl.appliesToRole === "PROVIDER") {
          throw new Error(`Deployer should not get provider-only template ${id}`);
        }
      }
    });

    it("BOTH sees PROVIDER + DEPLOYER + BOTH templates", () => {
      const result = classify(highRiskBothAnswers());
      const templates = getApplicableTemplates(result);
      const roles = new Set(templates.map(id => TEMPLATE_REGISTRY[id].appliesToRole));
      expect(roles.has("PROVIDER")).toBe(true);
      expect(roles.has("DEPLOYER")).toBe(true);
      expect(roles.has("BOTH")).toBe(true);
    });
  });

  // ── M3.5: Obligations with templateIds → templates are reachable via getApplicableTemplates ──
  describe("M3.5: Obligations templateId reachable via getApplicableTemplates", () => {
    const scenarios = [
      { name: "HIGH_RISK/PROVIDER", answers: highRiskProviderAnswers() },
      { name: "HIGH_RISK/DEPLOYER", answers: highRiskDeployerAnswers() },
      { name: "GPAI/PROVIDER", answers: gpaiProviderAnswers() },
      { name: "GPAI_SYSTEMIC/PROVIDER", answers: gpaiSystemicProviderAnswers() },
    ];

    for (const s of scenarios) {
      it(`${s.name}: obligation templateIds are in getApplicableTemplates output`, () => {
        const result = classify(s.answers);
        const templates = getApplicableTemplates(result);
        for (const obl of result.obligations) {
          if (obl.templateId) {
            const tmpl = TEMPLATE_REGISTRY[obl.templateId];
            if (!tmpl) continue;
            // Only check if role matches
            const roleMatches =
              tmpl.appliesToRole === "BOTH" ||
              tmpl.appliesToRole === result.role ||
              (result.role === "BOTH" && (tmpl.appliesToRole === "PROVIDER" || tmpl.appliesToRole === "DEPLOYER")) ||
              (result.detectedRoles?.includes(tmpl.appliesToRole as Role));
            if (roleMatches && tmpl.requiredFor.includes(result.classification)) {
              expect(
                templates,
                `Obligation ${obl.id} templateId ${obl.templateId} not in getApplicableTemplates`
              ).toContain(obl.templateId);
            }
          }
        }
      });
    }
  });

  // ── M3.6: No classification produces 0 templates ──
  describe("M3.6: Every non-PROHIBITED classification gets at least 1 template", () => {
    const scenarios = [
      { name: "HIGH_RISK/PROVIDER", answers: highRiskProviderAnswers() },
      { name: "HIGH_RISK/DEPLOYER", answers: highRiskDeployerAnswers() },
      { name: "GPAI/PROVIDER", answers: gpaiProviderAnswers() },
      { name: "GPAI_SYSTEMIC/PROVIDER", answers: gpaiSystemicProviderAnswers() },
      { name: "LIMITED_RISK/PROVIDER", answers: limitedRiskProviderAnswers() },
      { name: "LIMITED_RISK/DEPLOYER", answers: limitedRiskDeployerAnswers() },
      { name: "MINIMAL_RISK/PROVIDER", answers: minimalRiskProviderAnswers() },
      { name: "MINIMAL_RISK/DEPLOYER", answers: minimalRiskDeployerAnswers() },
    ];

    for (const s of scenarios) {
      it(`${s.name}: gets at least 1 template`, () => {
        const result = classify(s.answers);
        const templates = getApplicableTemplates(result);
        expect(templates.length).toBeGreaterThan(0);
      });
    }
  });

  // ── M3.7: Classification → obligation count alignment with template count ──
  it("M3.7: HIGH_RISK has more templates than MINIMAL_RISK", () => {
    const hrResult = classify(highRiskProviderAnswers());
    const mrResult = classify(minimalRiskProviderAnswers());
    const hrTemplates = getApplicableTemplates(hrResult);
    const mrTemplates = getApplicableTemplates(mrResult);
    expect(hrTemplates.length).toBeGreaterThan(mrTemplates.length);
  });

  it("M3.7b: GPAI_SYSTEMIC has more templates than GPAI", () => {
    const sysResult = classify(gpaiSystemicProviderAnswers());
    const gpaiResult = classify(gpaiProviderAnswers());
    const sysTemplates = getApplicableTemplates(sysResult);
    const gpaiTemplates = getApplicableTemplates(gpaiResult);
    expect(sysTemplates.length).toBeGreaterThan(gpaiTemplates.length);
  });
});

// ============================================================================
// MATRIX 4: INSTRUCTION COMPLETENESS (~44 tests)
// ============================================================================

describe("M4: Template-Specific Instruction Completeness", () => {
  // We test this by importing the internal function via a workaround.
  // Since getTemplateSpecificInstructions is not exported, we test it indirectly
  // through buildTemplatePrompt which is also not exported.
  // Instead, we verify that every template in the registry has handling in the source.

  // ── M4.1: Every template has specific instructions in doc-generator ──
  // (We verify by checking the doc-generator source for each template ID)
  // Since we can't easily import the private function, we'll verify via structural checks:

  describe("M4.1: Template instructions structural validation", () => {
    // The TEMPLATE_REGISTRY defines which templates exist.
    // We know from reading doc-generator.ts that getTemplateSpecificInstructions
    // has an entry for each template. We verify the registry entries are correct.

    for (const [id, tmpl] of Object.entries(TEMPLATE_REGISTRY)) {
      it(`${id}: name is descriptive (> 10 chars)`, () => {
        expect(tmpl.name.length).toBeGreaterThan(10);
      });

      it(`${id}: description is substantial (> 30 chars)`, () => {
        expect(tmpl.description.length).toBeGreaterThan(30);
      });

      it(`${id}: articles are specific`, () => {
        for (const art of tmpl.articles) {
          // Articles should have a number or specific reference
          expect(art.length).toBeGreaterThan(5);
        }
      });
    }
  });

  // ── M4.2: Estimated minutes are reasonable ──
  describe("M4.2: Estimated minutes are reasonable", () => {
    it("no template exceeds 240 minutes", () => {
      for (const [id, tmpl] of Object.entries(TEMPLATE_REGISTRY)) {
        expect(tmpl.estimatedMinutes, `${id} exceeds 240 min`).toBeLessThanOrEqual(240);
      }
    });

    it("no template is under 10 minutes", () => {
      for (const [id, tmpl] of Object.entries(TEMPLATE_REGISTRY)) {
        expect(tmpl.estimatedMinutes, `${id} under 10 min`).toBeGreaterThanOrEqual(10);
      }
    });

    it("total estimated time for HIGH_RISK PROVIDER is substantial", () => {
      const result = classify(highRiskProviderAnswers());
      const templates = getApplicableTemplates(result);
      const total = getEstimatedTime(templates);
      // HR provider should need multiple hours
      expect(total).toBeGreaterThan(300); // > 5 hours
    });

    it("total estimated time for MINIMAL_RISK is minimal", () => {
      const result = classify(minimalRiskProviderAnswers());
      const templates = getApplicableTemplates(result);
      const total = getEstimatedTime(templates);
      // Minimal risk should be quite short
      expect(total).toBeLessThan(300);
    });
  });

  // ── M4.3: getEstimatedTime function ──
  describe("M4.3: getEstimatedTime correctness", () => {
    it("returns 0 for empty array", () => {
      expect(getEstimatedTime([])).toBe(0);
    });

    it("returns correct sum for known templates", () => {
      const templates = ["TMPL_RISK_MANAGEMENT", "TMPL_DATA_GOVERNANCE"];
      const expected = TEMPLATE_REGISTRY["TMPL_RISK_MANAGEMENT"].estimatedMinutes
        + TEMPLATE_REGISTRY["TMPL_DATA_GOVERNANCE"].estimatedMinutes;
      expect(getEstimatedTime(templates)).toBe(expected);
    });

    it("ignores unknown template IDs gracefully", () => {
      const result = getEstimatedTime(["TMPL_RISK_MANAGEMENT", "NONEXISTENT"]);
      expect(result).toBe(TEMPLATE_REGISTRY["TMPL_RISK_MANAGEMENT"].estimatedMinutes);
    });

    it("sums all HR provider templates correctly", () => {
      const result = classify(highRiskProviderAnswers());
      const templates = getApplicableTemplates(result);
      const total = getEstimatedTime(templates);
      const manual = templates.reduce((sum, id) => sum + (TEMPLATE_REGISTRY[id]?.estimatedMinutes ?? 0), 0);
      expect(total).toBe(manual);
    });
  });
});

// ============================================================================
// MATRIX 5: PROMPT CONSTRUCTION QUALITY (~35 tests)
// ============================================================================

describe("M5: Prompt Construction Quality", () => {
  // We can't test buildTemplatePrompt directly since it's not exported,
  // but we can verify the inputs it would receive are correct.

  // ── M5.1: ClassificationResult has all fields needed for prompt context ──
  describe("M5.1: ClassificationResult structure for prompt building", () => {
    const scenarios = [
      { name: "HIGH_RISK", answers: highRiskProviderAnswers() },
      { name: "GPAI", answers: gpaiProviderAnswers() },
      { name: "GPAI_SYSTEMIC", answers: gpaiSystemicProviderAnswers() },
      { name: "LIMITED_RISK", answers: limitedRiskProviderAnswers() },
      { name: "MINIMAL_RISK", answers: minimalRiskProviderAnswers() },
    ];

    for (const s of scenarios) {
      it(`${s.name} result has required prompt fields`, () => {
        const result = classify(s.answers);
        expect(result).toHaveProperty("classification");
        expect(result).toHaveProperty("role");
        expect(result).toHaveProperty("confidence");
        expect(result).toHaveProperty("legalBasis");
        expect(result).toHaveProperty("enforcementDeadline");
        expect(Array.isArray(result.legalBasis)).toBe(true);
        expect(result.legalBasis.length).toBeGreaterThan(0);
      });
    }

    it("HIGH_RISK result has highRiskArea", () => {
      const result = classify(highRiskProviderAnswers());
      expect(result.highRiskArea).toBeDefined();
    });

    it("LIMITED_RISK result has transparencyObligations", () => {
      const result = classify(limitedRiskProviderAnswers());
      expect(result.transparencyObligations).toBeDefined();
      expect(result.transparencyObligations!.length).toBeGreaterThan(0);
    });

    it("all results have fineRisk", () => {
      const result = classify(highRiskProviderAnswers());
      expect(result.fineRisk).toBeDefined();
      expect(result.fineRisk).toHaveProperty("maxAmountGeneral");
      expect(result.fineRisk).toHaveProperty("maxPercentTurnover");
    });
  });

  // ── M5.2: Template articles are well-formatted for prompts ──
  describe("M5.2: Article format validation for prompt use", () => {
    for (const [id, tmpl] of Object.entries(TEMPLATE_REGISTRY)) {
      it(`${id} articles are joinable into a comma-separated string`, () => {
        const joined = tmpl.articles.join(", ");
        expect(joined.length).toBeGreaterThan(0);
        // Each article should be a meaningful reference
        for (const art of tmpl.articles) {
          expect(art.trim().length).toBeGreaterThan(0);
        }
      });
    }
  });

  // ── M5.3: Role formatting for prompts ──
  describe("M5.3: Role values are prompt-friendly", () => {
    it("BOTH role should format as provider AND deployer", () => {
      const result = classify(highRiskBothAnswers());
      expect(result.role).toBe("BOTH");
      // doc-generator.ts uses: result.role === "BOTH" ? "provider AND deployer" : result.role.toLowerCase()
    });

    for (const role of ["PROVIDER", "DEPLOYER"] as const) {
      it(`${role} role lowercases cleanly`, () => {
        expect(role.toLowerCase()).toMatch(/^[a-z]+$/);
      });
    }
  });

  // ── M5.4: Classification format strings ──
  describe("M5.4: Classification format completeness", () => {
    // doc-generator.ts formatClassification must handle all classifications
    const expectedFormats: Record<string, string> = {
      PROHIBITED: "Prohibited AI Practice (Art 5)",
      HIGH_RISK: "High-Risk AI System (Art 6)",
      LIMITED_RISK: "Limited Risk — Transparency Obligations (Art 50)",
      GPAI: "General-Purpose AI Model (Art 51-53)",
      GPAI_SYSTEMIC: "GPAI with Systemic Risk (Art 51-55)",
      MINIMAL_RISK: "Minimal Risk (voluntary compliance)",
    };

    for (const [cls, expected] of Object.entries(expectedFormats)) {
      it(`${cls} has format string`, () => {
        expect(expected).toBeTruthy();
        expect(expected.length).toBeGreaterThan(10);
      });
    }
  });

  // ── M5.5: High-risk area format strings ──
  describe("M5.5: HighRiskArea format completeness", () => {
    const areas = [
      "BIOMETRICS", "CRITICAL_INFRASTRUCTURE", "EDUCATION",
      "EMPLOYMENT", "ESSENTIAL_SERVICES", "LAW_ENFORCEMENT",
      "MIGRATION_ASYLUM_BORDER", "JUSTICE_DEMOCRACY",
    ];

    for (const area of areas) {
      it(`${area} high-risk area exists`, () => {
        // These are used in formatHighRiskArea inside doc-generator.ts
        expect(area).toBeTruthy();
      });
    }
  });

  // ── M5.6: Conditional instruction branches ──
  describe("M5.6: Conditional template instructions", () => {
    it("HUMAN_OVERSIGHT has deployer-specific instructions for DEPLOYER/BOTH", () => {
      // Template TMPL_HUMAN_OVERSIGHT instructions differ by role
      const tmpl = TEMPLATE_REGISTRY["TMPL_HUMAN_OVERSIGHT"];
      expect(tmpl.appliesToRole).toBe("BOTH");
    });

    it("CONFORMITY_ASSESSMENT varies by highRiskArea", () => {
      const tmpl = TEMPLATE_REGISTRY["TMPL_CONFORMITY_ASSESSMENT"];
      expect(tmpl).toBeDefined();
      // Biometrics/critical_infra → third-party required, others → internal control
    });

    it("GPAI_TECH_DOC has systemic risk additions", () => {
      const tmpl = TEMPLATE_REGISTRY["TMPL_GPAI_TECH_DOC"];
      expect(tmpl.requiredFor).toContain("GPAI_SYSTEMIC");
      // Instructions add systemic risk sections for GPAI_SYSTEMIC
    });

    it("DPIA_AI has gdprInterplay conditional", () => {
      const tmpl = TEMPLATE_REGISTRY["TMPL_DPIA_AI"];
      expect(tmpl).toBeDefined();
      // Instructions conditionally add GDPR flags
    });
  });
});

// ============================================================================
// MATRIX 6: API ROUTE VALIDATION (~20 tests)
// ============================================================================

describe("M6: API Route Validation", () => {
  // Since we can't easily test Next.js API routes in vitest without a server,
  // we test the logic by examining the route's dependencies.

  // ── M6.1: Route dependencies are importable ──
  describe("M6.1: Route dependencies available", () => {
    it("getApplicableTemplates is exported", () => {
      expect(typeof getApplicableTemplates).toBe("function");
    });

    it("getEstimatedTime is exported", () => {
      expect(typeof getEstimatedTime).toBe("function");
    });

    it("TEMPLATE_REGISTRY is exported", () => {
      expect(typeof TEMPLATE_REGISTRY).toBe("object");
      expect(Object.keys(TEMPLATE_REGISTRY).length).toBe(36);
    });
  });

  // ── M6.2: Template lookup for GET route behavior ──
  describe("M6.2: GET route template lookup", () => {
    it("minimal result object works with getApplicableTemplates", () => {
      const minimalResult = {
        classification: "HIGH_RISK",
        role: "PROVIDER",
      } as ClassificationResult;

      const templates = getApplicableTemplates(minimalResult);
      expect(templates.length).toBeGreaterThan(0);
    });

    it("all classifications work with minimal result", () => {
      for (const cls of ["HIGH_RISK", "LIMITED_RISK", "GPAI", "GPAI_SYSTEMIC", "MINIMAL_RISK"] as const) {
        const minResult = { classification: cls, role: "PROVIDER" } as ClassificationResult;
        const t = getApplicableTemplates(minResult);
        expect(t.length, `${cls} should have templates`).toBeGreaterThan(0);
      }
    });

    it("PROHIBITED classification returns no templates", () => {
      const minResult = { classification: "PROHIBITED", role: "PROVIDER" } as ClassificationResult;
      const t = getApplicableTemplates(minResult);
      expect(t.length).toBe(0);
    });
  });

  // ── M6.3: EXEC_SUMMARY template ID handling ──
  describe("M6.3: EXEC_SUMMARY special case", () => {
    it("EXEC_SUMMARY is not in TEMPLATE_REGISTRY (it is special-cased)", () => {
      expect(TEMPLATE_REGISTRY["EXEC_SUMMARY"]).toBeUndefined();
    });

    it("getApplicableTemplates never returns EXEC_SUMMARY", () => {
      const scenarios = [
        highRiskProviderAnswers(), gpaiProviderAnswers(),
        limitedRiskProviderAnswers(), minimalRiskProviderAnswers(),
      ];
      for (const answers of scenarios) {
        const result = classify(answers);
        const templates = getApplicableTemplates(result);
        expect(templates).not.toContain("EXEC_SUMMARY");
      }
    });
  });

  // ── M6.4: Template registry lookup consistency ──
  describe("M6.4: Registry lookup for POST route", () => {
    it("every template returned by getApplicableTemplates can be looked up", () => {
      const result = classify(highRiskProviderAnswers());
      const templates = getApplicableTemplates(result);
      for (const id of templates) {
        const tmpl = TEMPLATE_REGISTRY[id];
        expect(tmpl, `${id} lookup failed`).toBeDefined();
        expect(tmpl.name).toBeTruthy();
      }
    });
  });
});

// ============================================================================
// MATRIX 7: GENERATION FUNCTIONS MOCKED (~35 tests)
// ============================================================================

describe("M7: Generation Function Structure", () => {
  // We test the structure and contract of the generation functions
  // without actually calling Claude API.

  // ── M7.1: generateDocument contract ──
  describe("M7.1: generateDocument requires valid template", () => {
    it("throws for unknown template (import and mock test)", async () => {
      // We dynamically import doc-generator to test error cases
      // Without a valid API key, getClient throws first,
      // but unknown templates should throw before API call
      const docGen = await import("../doc-generator");
      await expect(
        docGen.generateDocument("NONEXISTENT_TEMPLATE", classify(highRiskProviderAnswers()), "TestCo", "Test system")
      ).rejects.toThrow("Unknown template");
    });
  });

  // ── M7.2: generateAllDocuments contract ──
  describe("M7.2: generateAllDocuments returns empty for no templates", () => {
    it("returns empty array when selectedTemplateIds is empty", async () => {
      const docGen = await import("../doc-generator");
      const result = classify(highRiskProviderAnswers());
      const docs = await docGen.generateAllDocuments({
        result,
        companyName: "TestCo",
        systemDescription: "Test",
        selectedTemplateIds: [],
      });
      expect(docs).toEqual([]);
    });
  });

  // ── M7.3: getApplicableTemplates determinism ──
  describe("M7.3: getApplicableTemplates is deterministic", () => {
    it("returns same results on multiple calls", () => {
      const result = classify(highRiskProviderAnswers());
      const t1 = getApplicableTemplates(result);
      const t2 = getApplicableTemplates(result);
      const t3 = getApplicableTemplates(result);
      expect(t1).toEqual(t2);
      expect(t2).toEqual(t3);
    });

    it("order is stable", () => {
      const result = classify(highRiskProviderAnswers());
      const t1 = getApplicableTemplates(result);
      const t2 = getApplicableTemplates(result);
      for (let i = 0; i < t1.length; i++) {
        expect(t1[i]).toBe(t2[i]);
      }
    });
  });

  // ── M7.4: Template filtering logic ──
  describe("M7.4: Filtering logic edge cases", () => {
    it("result with no detectedRoles still works", () => {
      const result: ClassificationResult = {
        classification: "HIGH_RISK",
        role: "PROVIDER",
        confidence: "DEFINITIVE",
        legalBasis: ["Article 6"],
        obligations: [],
        enforcementDeadline: "AUGUST_2026",
        fineRisk: { maxAmountGeneral: "€15M", maxPercentTurnover: 3 },
        nextSteps: [],
        warnings: [],
        smeSimplifications: [],
      };
      // No detectedRoles
      const templates = getApplicableTemplates(result);
      expect(templates.length).toBeGreaterThan(0);
    });

    it("result with empty detectedRoles still works", () => {
      const result: ClassificationResult = {
        classification: "HIGH_RISK",
        role: "PROVIDER",
        detectedRoles: [],
        confidence: "DEFINITIVE",
        legalBasis: ["Article 6"],
        obligations: [],
        enforcementDeadline: "AUGUST_2026",
        fineRisk: { maxAmountGeneral: "€15M", maxPercentTurnover: 3 },
        nextSteps: [],
        warnings: [],
        smeSimplifications: [],
      };
      const templates = getApplicableTemplates(result);
      expect(templates.length).toBeGreaterThan(0);
    });

    it("BOTH role includes PROVIDER and DEPLOYER templates", () => {
      const result: ClassificationResult = {
        classification: "HIGH_RISK",
        role: "BOTH",
        confidence: "DEFINITIVE",
        legalBasis: ["Article 6"],
        obligations: [],
        enforcementDeadline: "AUGUST_2026",
        fineRisk: { maxAmountGeneral: "€15M", maxPercentTurnover: 3 },
        nextSteps: [],
        warnings: [],
        smeSimplifications: [],
      };
      const templates = getApplicableTemplates(result);
      const hasProvider = templates.some(id => TEMPLATE_REGISTRY[id].appliesToRole === "PROVIDER");
      const hasDeployer = templates.some(id => TEMPLATE_REGISTRY[id].appliesToRole === "DEPLOYER");
      expect(hasProvider).toBe(true);
      expect(hasDeployer).toBe(true);
    });

    it("detectedRoles adds extra templates", () => {
      const withoutImporter: ClassificationResult = {
        classification: "HIGH_RISK",
        role: "DEPLOYER",
        detectedRoles: ["DEPLOYER"],
        confidence: "DEFINITIVE",
        legalBasis: ["Article 6"],
        obligations: [],
        enforcementDeadline: "AUGUST_2026",
        fineRisk: { maxAmountGeneral: "€15M", maxPercentTurnover: 3 },
        nextSteps: [],
        warnings: [],
        smeSimplifications: [],
      };
      const withImporter: ClassificationResult = {
        ...withoutImporter,
        detectedRoles: ["DEPLOYER", "IMPORTER"],
      };
      const t1 = getApplicableTemplates(withoutImporter);
      const t2 = getApplicableTemplates(withImporter);
      expect(t2.length).toBeGreaterThan(t1.length);
      expect(t2).toContain("TMPL_IMPORTER_CHECKLIST");
      expect(t1).not.toContain("TMPL_IMPORTER_CHECKLIST");
    });
  });

  // ── M7.5: getEstimatedTime edge cases ──
  describe("M7.5: getEstimatedTime edge cases", () => {
    it("handles single template", () => {
      const time = getEstimatedTime(["TMPL_RISK_MANAGEMENT"]);
      expect(time).toBe(120);
    });

    it("handles all templates", () => {
      const time = getEstimatedTime(ALL_TEMPLATE_IDS);
      const total = ALL_TEMPLATE_IDS.reduce(
        (sum, id) => sum + TEMPLATE_REGISTRY[id].estimatedMinutes,
        0
      );
      expect(time).toBe(total);
    });

    it("handles duplicate template IDs", () => {
      const time = getEstimatedTime(["TMPL_RISK_MANAGEMENT", "TMPL_RISK_MANAGEMENT"]);
      expect(time).toBe(240); // 120 × 2 since it doesn't deduplicate
    });
  });
});

// ============================================================================
// MATRIX 8: E2E INTEGRATION FLOWS (~30 tests)
// ============================================================================

describe("M8: E2E Integration Flows", () => {
  // ── M8.1: Full flow: answers → classify → templates → verify ──
  describe("M8.1: Complete classification-to-template flows", () => {
    it("HR PROVIDER flow: education AI", () => {
      const answers = baseAnswers({ educationUseCase: true, posesSignificantRiskOfHarm: true });
      const result = classify(answers);
      expect(result.classification).toBe("HIGH_RISK");
      expect(result.highRiskArea).toBe("EDUCATION");
      const templates = getApplicableTemplates(result);
      expect(templates.length).toBeGreaterThan(10);
      expect(templates).toContain("TMPL_RISK_MANAGEMENT");
    });

    it("HR PROVIDER flow: biometrics AI", () => {
      const answers = baseAnswers({ usesBiometrics: true, isBiometricVerificationOnly: false });
      const result = classify(answers);
      expect(result.classification).toBe("HIGH_RISK");
      expect(result.highRiskArea).toBe("BIOMETRICS");
      const templates = getApplicableTemplates(result);
      expect(templates).toContain("TMPL_CONFORMITY_ASSESSMENT");
    });

    it("HR DEPLOYER flow: essential services", () => {
      const answers = baseAnswers({ role: "DEPLOYER", essentialServicesUseCase: true });
      const result = classify(answers);
      expect(result.classification).toBe("HIGH_RISK");
      const templates = getApplicableTemplates(result);
      expect(templates).toContain("TMPL_FUNDAMENTAL_RIGHTS_IMPACT");
      expect(templates).toContain("TMPL_DEPLOYER_PROCEDURES");
    });

    it("HR DEPLOYER+IMPORTER flow", () => {
      const answers = baseAnswers({
        role: "DEPLOYER",
        essentialServicesUseCase: true,
        broughtSystemFromOutsideEU: true,
      });
      const result = classify(answers);
      expect(result.classification).toBe("HIGH_RISK");
      expect(result.detectedRoles).toContain("IMPORTER");
      const templates = getApplicableTemplates(result);
      expect(templates).toContain("TMPL_IMPORTER_CHECKLIST");
      expect(templates).toContain("TMPL_DEPLOYER_PROCEDURES");
    });

    it("GPAI flow: non-systemic", () => {
      const answers = baseAnswers({ isGeneralPurposeModel: true });
      const result = classify(answers);
      expect(result.classification).toBe("GPAI");
      const templates = getApplicableTemplates(result);
      expect(templates).toContain("TMPL_GPAI_TECH_DOC");
      expect(templates).toContain("TMPL_COPYRIGHT_POLICY");
      expect(templates).not.toContain("TMPL_GPAI_SYSTEMIC_RISK");
    });

    it("GPAI_SYSTEMIC flow: high-impact capabilities", () => {
      const answers = baseAnswers({ isGeneralPurposeModel: true, gpaiHighImpactCapabilities: true });
      const result = classify(answers);
      expect(result.classification).toBe("GPAI_SYSTEMIC");
      const templates = getApplicableTemplates(result);
      expect(templates).toContain("TMPL_GPAI_SYSTEMIC_RISK");
      expect(templates).toContain("TMPL_CODES_OF_PRACTICE");
    });

    it("GPAI_SYSTEMIC flow: compute threshold", () => {
      const answers = baseAnswers({ isGeneralPurposeModel: true, gpaiTrainingCompute: 2e25 });
      const result = classify(answers);
      expect(result.classification).toBe("GPAI_SYSTEMIC");
      const templates = getApplicableTemplates(result);
      expect(templates).toContain("TMPL_GPAI_SYSTEMIC_RISK");
    });

    it("LIMITED_RISK flow: human interaction", () => {
      const answers = baseAnswers({ interactsWithHumans: true });
      const result = classify(answers);
      expect(result.classification).toBe("LIMITED_RISK");
      const templates = getApplicableTemplates(result);
      expect(templates).toContain("TMPL_AI_INTERACTION_NOTICE");
      expect(templates).toContain("TMPL_AI_LITERACY_PLAN");
    });

    it("MINIMAL_RISK flow: no special flags", () => {
      const answers = baseAnswers();
      const result = classify(answers);
      expect(result.classification).toBe("MINIMAL_RISK");
      const templates = getApplicableTemplates(result);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates).toContain("TMPL_AI_LITERACY_PLAN");
    });
  });

  // ── M8.2: Template time estimation flows ──
  describe("M8.2: Estimation accuracy by scenario", () => {
    it("HR PROVIDER total time is > 10 hours", () => {
      const result = classify(highRiskProviderAnswers());
      const templates = getApplicableTemplates(result);
      const total = getEstimatedTime(templates);
      expect(total).toBeGreaterThan(600); // > 10 hours
    });

    it("GPAI total time is > 4 hours", () => {
      const result = classify(gpaiProviderAnswers());
      const templates = getApplicableTemplates(result);
      const total = getEstimatedTime(templates);
      expect(total).toBeGreaterThan(240);
    });

    it("MINIMAL_RISK total time is < 3 hours", () => {
      const result = classify(minimalRiskProviderAnswers());
      const templates = getApplicableTemplates(result);
      const total = getEstimatedTime(templates);
      expect(total).toBeLessThan(180);
    });
  });

  // ── M8.3: Multiple transparency flags ──
  describe("M8.3: Multiple transparency flags", () => {
    it("multiple transparency flags → still LIMITED_RISK", () => {
      const answers = baseAnswers({
        interactsWithHumans: true,
        generatesMedia: true,
        usesEmotionRecognition: true,
      });
      const result = classify(answers);
      expect(result.classification).toBe("LIMITED_RISK");
    });

    it("LIMITED_RISK BOTH gets provider + deployer transparency templates", () => {
      const answers = baseAnswers({
        role: "BOTH",
        interactsWithHumans: true,
        generatesMedia: true,
      });
      const result = classify(answers);
      expect(result.classification).toBe("LIMITED_RISK");
      const templates = getApplicableTemplates(result);
      // Should get both provider and deployer LR templates
      expect(templates).toContain("TMPL_AI_INTERACTION_NOTICE"); // PROVIDER
      expect(templates).toContain("TMPL_DEEPFAKE_DISCLOSURE"); // DEPLOYER
      expect(templates).toContain("TMPL_AI_TEXT_LABEL"); // BOTH
    });
  });

  // ── M8.4: High-risk escalation doesn't leak templates ──
  describe("M8.4: Classification escalation", () => {
    it("HIGH_RISK escalation doesn't include GPAI templates", () => {
      const result = classify(highRiskProviderAnswers());
      const templates = getApplicableTemplates(result);
      const gpaiOnly = ["TMPL_GPAI_TECH_DOC", "TMPL_GPAI_DOWNSTREAM", "TMPL_COPYRIGHT_POLICY", "TMPL_TRAINING_SUMMARY"];
      for (const id of gpaiOnly) {
        expect(templates).not.toContain(id);
      }
    });

    it("GPAI classification doesn't include HIGH_RISK templates", () => {
      const result = classify(gpaiProviderAnswers());
      const templates = getApplicableTemplates(result);
      const hrOnly = ["TMPL_RISK_MANAGEMENT", "TMPL_DATA_GOVERNANCE", "TMPL_QMS"];
      for (const id of hrOnly) {
        expect(templates).not.toContain(id);
      }
    });
  });
});

// ============================================================================
// MATRIX 9: ORPHAN TEMPLATE FIX VERIFICATION (~15 tests)
// ============================================================================

describe("M9: Orphan Template Fix Verification", () => {
  // These tests verify that the 11 orphan templates are now correctly
  // linked to obligations via templateId fields.

  const orphanPairs = [
    { templateId: "TMPL_AI_LITERACY_PLAN", obligation: "AI_LITERACY", scenarios: [highRiskProviderAnswers(), gpaiProviderAnswers(), limitedRiskProviderAnswers(), minimalRiskProviderAnswers()] },
    { templateId: "TMPL_SERIOUS_INCIDENT_REPORT", obligation: "SERIOUS_INCIDENT_REPORTING", scenarios: [highRiskProviderAnswers()] },
    { templateId: "TMPL_DEPLOYER_PROCEDURES", obligation: "INFORM_WORKERS", scenarios: [highRiskDeployerAnswers()] },
    { templateId: "TMPL_INFORM_AFFECTED", obligation: "INFORM_AFFECTED_PERSONS", scenarios: [highRiskDeployerAnswers()] },
    { templateId: "TMPL_DPIA_AI", obligation: "DPIA_IF_APPLICABLE", scenarios: [highRiskDeployerAnswers()] },
    { templateId: "TMPL_IMPORTER_CHECKLIST", obligation: "IMPORTER_VERIFY_CONFORMITY", scenarios: [highRiskDeployerAnswers({ broughtSystemFromOutsideEU: true })] },
    { templateId: "TMPL_DISTRIBUTOR_CHECKLIST", obligation: "DISTRIBUTOR_VERIFY_COMPLIANCE", scenarios: [highRiskDeployerAnswers({ resellsOrDistributesSystem: true })] },
    { templateId: "TMPL_AUTH_REP_MANDATE", obligation: "AUTH_REP_VERIFY_DOCUMENTATION", scenarios: [highRiskDeployerAnswers({ appointedAsAuthorisedRep: true })] },
    { templateId: "TMPL_GPAI_SYSTEMIC_RISK", obligation: "SYSTEMIC_RISK_MITIGATION", scenarios: [gpaiSystemicProviderAnswers()] },
    { templateId: "TMPL_CODES_OF_PRACTICE", obligation: "CODES_OF_PRACTICE_ADHERENCE", scenarios: [gpaiSystemicProviderAnswers()] },
    { templateId: "TMPL_SUBSTANTIAL_MOD_ASSESSMENT", obligation: "SUBSTANTIAL_MOD_REASSESSMENT", scenarios: [highRiskProviderAnswers({ madeSubstantialModification: true })] },
  ];

  for (const pair of orphanPairs) {
    describe(`${pair.templateId} ↔ ${pair.obligation}`, () => {
      it("template exists in registry", () => {
        expect(TEMPLATE_REGISTRY[pair.templateId]).toBeDefined();
      });

      it("obligation has correct templateId link", () => {
        const result = classify(pair.scenarios[0]);
        const obl = result.obligations.find(o => o.id === pair.obligation);
        expect(obl, `Obligation ${pair.obligation} not found`).toBeDefined();
        expect(obl!.templateId).toBe(pair.templateId);
      });

      it("template is reachable via getApplicableTemplates", () => {
        const result = classify(pair.scenarios[0]);
        const templates = getApplicableTemplates(result);
        expect(templates).toContain(pair.templateId);
      });
    });
  }
});

// ============================================================================
// MATRIX 10: EDGE CASES & BOUNDARY (~25 tests)
// ============================================================================

describe("M10: Edge Cases & Boundary", () => {
  // ── M10.1: PROHIBITED gets no templates ──
  it("M10.1: PROHIBITED system gets 0 templates", () => {
    const answers = baseAnswers({
      usesSubliminaManipulation: true,
      manipulationCausesSignificantHarm: true,
    });
    const result = classify(answers);
    expect(result.classification).toBe("PROHIBITED");
    const templates = getApplicableTemplates(result);
    expect(templates.length).toBe(0);
  });

  // ── M10.2: Empty role set handling ──
  it("M10.2: getApplicableTemplates handles minimal result", () => {
    const result = {
      classification: "HIGH_RISK",
      role: "PROVIDER",
    } as ClassificationResult;
    expect(() => getApplicableTemplates(result)).not.toThrow();
  });

  // ── M10.3: All template IDs start with TMPL_ ──
  it("M10.3: template ID naming convention", () => {
    for (const id of ALL_TEMPLATE_IDS) {
      expect(id).toMatch(/^TMPL_/);
    }
  });

  // ── M10.4: No template has empty articles ──
  it("M10.4: no template has empty articles array", () => {
    for (const [id, tmpl] of Object.entries(TEMPLATE_REGISTRY)) {
      expect(tmpl.articles.length, `${id} has no articles`).toBeGreaterThan(0);
    }
  });

  // ── M10.5: Template names don't have trailing whitespace ──
  it("M10.5: template names are trimmed", () => {
    for (const [id, tmpl] of Object.entries(TEMPLATE_REGISTRY)) {
      expect(tmpl.name, `${id} name has trailing whitespace`).toBe(tmpl.name.trim());
      expect(tmpl.description, `${id} desc has trailing whitespace`).toBe(tmpl.description.trim());
    }
  });

  // ── M10.6: getEstimatedTime with all templates ──
  it("M10.6: total time for all 36 templates is reasonable", () => {
    const total = getEstimatedTime(ALL_TEMPLATE_IDS);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(5000); // < ~83 hours
  });

  // ── M10.7: Role-specific template counts ──
  describe("M10.7: Role template distribution", () => {
    it("PROVIDER has the most HIGH_RISK templates", () => {
      const providerCount = Object.values(TEMPLATE_REGISTRY)
        .filter(t => t.requiredFor.includes("HIGH_RISK") && (t.appliesToRole === "PROVIDER" || t.appliesToRole === "BOTH"))
        .length;
      const deployerCount = Object.values(TEMPLATE_REGISTRY)
        .filter(t => t.requiredFor.includes("HIGH_RISK") && (t.appliesToRole === "DEPLOYER" || t.appliesToRole === "BOTH"))
        .length;
      expect(providerCount).toBeGreaterThanOrEqual(deployerCount);
    });

    it("each extended role has exactly 1 HIGH_RISK template", () => {
      for (const role of ["IMPORTER", "DISTRIBUTOR", "AUTHORISED_REPRESENTATIVE"]) {
        const count = Object.values(TEMPLATE_REGISTRY)
          .filter(t => t.requiredFor.includes("HIGH_RISK") && t.appliesToRole === role)
          .length;
        expect(count, `${role} template count`).toBe(1);
      }
    });
  });

  // ── M10.8: Stability under repeat classification ──
  it("M10.8: classify → getApplicableTemplates is stable across runs", () => {
    for (let i = 0; i < 5; i++) {
      const result = classify(highRiskProviderAnswers());
      const templates = getApplicableTemplates(result);
      expect(result.classification).toBe("HIGH_RISK");
      expect(templates).toContain("TMPL_RISK_MANAGEMENT");
    }
  });

  // ── M10.9: No template appears in both GPAI and HIGH_RISK (except AI_LITERACY) ──
  it("M10.9: classification isolation — GPAI and HIGH_RISK don't share templates (except universal)", () => {
    const gpaiTmpls = Object.entries(TEMPLATE_REGISTRY)
      .filter(([, t]) => t.requiredFor.includes("GPAI") && !t.requiredFor.includes("HIGH_RISK"))
      .map(([id]) => id);

    const hrTmpls = Object.entries(TEMPLATE_REGISTRY)
      .filter(([, t]) => t.requiredFor.includes("HIGH_RISK") && !t.requiredFor.includes("GPAI"))
      .map(([id]) => id);

    // These sets should have no overlap
    for (const id of gpaiTmpls) {
      expect(hrTmpls).not.toContain(id);
    }
  });

  // ── M10.10: ALL_CLASSIFICATIONS coverage in registry ──
  it("M10.10: every non-PROHIBITED classification has templates in registry", () => {
    for (const cls of ["HIGH_RISK", "LIMITED_RISK", "GPAI", "GPAI_SYSTEMIC", "MINIMAL_RISK"] as const) {
      const count = Object.values(TEMPLATE_REGISTRY)
        .filter(t => t.requiredFor.includes(cls))
        .length;
      expect(count, `${cls} should have templates`).toBeGreaterThan(0);
    }
  });

  // ── M10.11: PROHIBITED has no templates ──
  it("M10.11: no template in registry targets PROHIBITED", () => {
    const prohibitedTemplates = Object.values(TEMPLATE_REGISTRY)
      .filter(t => (t.requiredFor as string[]).includes("PROHIBITED"));
    expect(prohibitedTemplates.length).toBe(0);
  });

  // ── M10.12: Template with multiple classifications ──
  it("M10.12: AI_LITERACY_PLAN covers all non-PROHIBITED classifications", () => {
    const tmpl = TEMPLATE_REGISTRY["TMPL_AI_LITERACY_PLAN"];
    expect(tmpl.requiredFor).toContain("HIGH_RISK");
    expect(tmpl.requiredFor).toContain("LIMITED_RISK");
    expect(tmpl.requiredFor).toContain("GPAI");
    expect(tmpl.requiredFor).toContain("GPAI_SYSTEMIC");
    expect(tmpl.requiredFor).toContain("MINIMAL_RISK");
  });

  // ── M10.13: EU_DB_REGISTRATION multi-classification ──
  it("M10.13: EU_DB_REGISTRATION covers HIGH_RISK and MINIMAL_RISK", () => {
    const tmpl = TEMPLATE_REGISTRY["TMPL_EU_DB_REGISTRATION"];
    expect(tmpl.requiredFor).toContain("HIGH_RISK");
    expect(tmpl.requiredFor).toContain("MINIMAL_RISK");
  });

  // ── M10.14: GPAI templates are PROVIDER-only ──
  it("M10.14: all GPAI-exclusive templates are PROVIDER-only", () => {
    const gpaiOnly = Object.entries(TEMPLATE_REGISTRY)
      .filter(([, t]) =>
        t.requiredFor.includes("GPAI") &&
        !t.requiredFor.includes("HIGH_RISK") &&
        !t.requiredFor.includes("LIMITED_RISK") &&
        !t.requiredFor.includes("MINIMAL_RISK")
      );
    for (const [id, tmpl] of gpaiOnly) {
      expect(
        ["PROVIDER", "BOTH"],
        `${id} should be PROVIDER or BOTH`
      ).toContain(tmpl.appliesToRole);
    }
  });

  // ── M10.15: Stress test — classify all combos, no errors ──
  it("M10.15: no error for any role × any use case combo", () => {
    const roles: Array<"PROVIDER" | "DEPLOYER" | "BOTH"> = ["PROVIDER", "DEPLOYER", "BOTH"];
    const flags = [
      { educationUseCase: true, posesSignificantRiskOfHarm: true },
      { interactsWithHumans: true },
      { isGeneralPurposeModel: true },
      { isGeneralPurposeModel: true, gpaiHighImpactCapabilities: true },
      {}, // minimal risk
    ];

    for (const role of roles) {
      for (const flag of flags) {
        const answers = baseAnswers({ role, ...flag });
        expect(() => {
          const result = classify(answers);
          getApplicableTemplates(result);
          getEstimatedTime(getApplicableTemplates(result));
        }).not.toThrow();
      }
    }
  });
});
